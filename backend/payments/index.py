import json
import os
import time
import hashlib
import secrets
import base64
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras


def _db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _cors(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'isBase64Encoded': False,
        'body': json.dumps(body),
    }


def _list_products(conn):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        "SELECT id, title, description, emoji, tag, price_uzs FROM products WHERE is_active = TRUE ORDER BY id"
    )
    rows = cur.fetchall()
    cur.close()
    return _cors(200, {'products': [dict(r) for r in rows]})


def _create_order(conn, params):
    product_id = int(params.get('product_id', 0))
    provider = params.get('provider', '')
    email = params.get('email', '')
    if provider not in ('click', 'payme'):
        return _cors(400, {'error': 'invalid_provider'})

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, price_uzs, title FROM products WHERE id = %s AND is_active = TRUE", (product_id,))
    product = cur.fetchone()
    if not product:
        cur.close()
        return _cors(404, {'error': 'product_not_found'})

    token = secrets.token_hex(16)
    amount = int(product['price_uzs'])
    cur.execute(
        "INSERT INTO orders (order_token, product_id, amount_uzs, provider, status, customer_email) "
        "VALUES (%s, %s, %s, %s, 'created', %s) RETURNING id",
        (token, product_id, amount, provider, email),
    )
    order_id = cur.fetchone()['id']
    conn.commit()
    cur.close()

    if provider == 'click':
        service_id = os.environ.get('CLICK_SERVICE_ID', '')
        merchant_id = os.environ.get('CLICK_MERCHANT_ID', '')
        return_url = params.get('return_url', '')
        pay_url = (
            f"https://my.click.uz/services/pay?service_id={service_id}"
            f"&merchant_id={merchant_id}&amount={amount}"
            f"&transaction_param={token}&return_url={return_url}"
        )
    else:
        merchant_id = os.environ.get('PAYME_MERCHANT_ID', '')
        return_url = params.get('return_url', '')
        raw = (
            f"m={merchant_id};ac.order_token={token};a={amount * 100};c={return_url}"
        )
        encoded = base64.b64encode(raw.encode()).decode()
        pay_url = f"https://checkout.paycom.uz/{encoded}"

    return _cors(200, {'order_token': token, 'order_id': order_id, 'pay_url': pay_url, 'amount': amount})


def _order_status(conn, params):
    token = params.get('order_token', '')
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        "SELECT o.status, o.provider, p.title, p.file_url FROM orders o "
        "JOIN products p ON p.id = o.product_id WHERE o.order_token = %s",
        (token,),
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return _cors(404, {'error': 'order_not_found'})
    result = {'status': row['status'], 'title': row['title']}
    if row['status'] == 'paid':
        result['file_url'] = row['file_url']
    return _cors(200, result)


def _mark_paid(conn, token, provider, tx_id):
    cur = conn.cursor()
    cur.execute(
        "UPDATE orders SET status = 'paid', provider_transaction_id = %s, paid_at = %s "
        "WHERE order_token = %s AND status != 'paid'",
        (tx_id, datetime.now(timezone.utc), token),
    )
    conn.commit()
    cur.close()


def _click_webhook(conn, body):
    p = body
    secret_key = os.environ.get('CLICK_SECRET_KEY', '')
    service_id = os.environ.get('CLICK_SERVICE_ID', '')
    action = p.get('action')
    click_trans_id = p.get('click_trans_id', '')
    merchant_trans_id = p.get('merchant_trans_id', '')
    amount = p.get('amount', '')
    sign_time = p.get('sign_time', '')
    sign_string = p.get('sign_string', '')

    if action == '0':
        base = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{amount}{action}{sign_time}"
    else:
        merchant_prepare_id = p.get('merchant_prepare_id', '')
        base = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{merchant_prepare_id}{amount}{action}{sign_time}"
    expected = hashlib.md5(base.encode()).hexdigest()
    if expected != sign_string:
        return _cors(200, {'error': -1, 'error_note': 'SIGN CHECK FAILED'})

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, amount_uzs, status FROM orders WHERE order_token = %s", (merchant_trans_id,))
    order = cur.fetchone()
    cur.close()
    if not order:
        return _cors(200, {'error': -5, 'error_note': 'Order not found'})

    if action == '0':
        return _cors(200, {
            'click_trans_id': click_trans_id,
            'merchant_trans_id': merchant_trans_id,
            'merchant_prepare_id': order['id'],
            'error': 0,
            'error_note': 'Success',
        })
    elif action == '1':
        _mark_paid(conn, merchant_trans_id, 'click', click_trans_id)
        return _cors(200, {
            'click_trans_id': click_trans_id,
            'merchant_trans_id': merchant_trans_id,
            'merchant_confirm_id': order['id'],
            'error': 0,
            'error_note': 'Success',
        })
    return _cors(200, {'error': -3, 'error_note': 'Action not found'})


def _payme_error(code, message):
    return _cors(200, {'error': {'code': code, 'message': message}})


def _payme_webhook(conn, body, headers):
    key = os.environ.get('PAYME_KEY', '')
    auth = headers.get('authorization') or headers.get('Authorization') or \
        headers.get('x-authorization') or headers.get('X-Authorization') or ''
    expected = 'Basic ' + base64.b64encode(f"Paycom:{key}".encode()).decode()
    if auth != expected:
        return _cors(200, {'error': {'code': -32504, 'message': 'Insufficient privileges'}})

    method = body.get('method')
    params = body.get('params', {})
    req_id = body.get('id')

    def reply(result):
        return _cors(200, {'result': result, 'id': req_id})

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if method == 'CheckPerformTransaction':
        token = params.get('account', {}).get('order_token', '')
        cur.execute("SELECT amount_uzs FROM orders WHERE order_token = %s", (token,))
        o = cur.fetchone()
        cur.close()
        if not o:
            return _payme_error(-31050, 'Order not found')
        if params.get('amount') != o['amount_uzs'] * 100:
            return _payme_error(-31001, 'Wrong amount')
        return reply({'allow': True})

    if method == 'CreateTransaction':
        token = params.get('account', {}).get('order_token', '')
        tx = params.get('id')
        cur.execute("SELECT id, amount_uzs, status, provider_transaction_id FROM orders WHERE order_token = %s", (token,))
        o = cur.fetchone()
        if not o:
            cur.close()
            return _payme_error(-31050, 'Order not found')
        cur.execute(
            "UPDATE orders SET provider_transaction_id = %s, provider = 'payme' WHERE order_token = %s",
            (tx, token),
        )
        conn.commit()
        cur.close()
        return reply({
            'create_time': int(time.time() * 1000),
            'transaction': str(o['id']),
            'state': 1,
        })

    if method == 'PerformTransaction':
        tx = params.get('id')
        cur.execute("SELECT id, order_token, status FROM orders WHERE provider_transaction_id = %s", (tx,))
        o = cur.fetchone()
        if not o:
            cur.close()
            return _payme_error(-31003, 'Transaction not found')
        if o['status'] != 'paid':
            _mark_paid(conn, o['order_token'], 'payme', tx)
        cur.close()
        return reply({
            'transaction': str(o['id']),
            'perform_time': int(time.time() * 1000),
            'state': 2,
        })

    if method == 'CheckTransaction':
        tx = params.get('id')
        cur.execute("SELECT id, status, paid_at FROM orders WHERE provider_transaction_id = %s", (tx,))
        o = cur.fetchone()
        cur.close()
        if not o:
            return _payme_error(-31003, 'Transaction not found')
        state = 2 if o['status'] == 'paid' else 1
        perform = int(o['paid_at'].timestamp() * 1000) if o['paid_at'] else 0
        return reply({
            'transaction': str(o['id']),
            'state': state,
            'create_time': 0,
            'perform_time': perform,
            'cancel_time': 0,
            'reason': None,
        })

    if method == 'CancelTransaction':
        tx = params.get('id')
        cur.execute("UPDATE orders SET status = 'cancelled' WHERE provider_transaction_id = %s RETURNING id", (tx,))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        if not row:
            return _payme_error(-31003, 'Transaction not found')
        return reply({
            'transaction': str(row['id']),
            'cancel_time': int(time.time() * 1000),
            'state': -1,
        })

    cur.close()
    return _payme_error(-32601, 'Method not found')


def handler(event, context):
    '''Оплата заказов через Click и Payme с автоматической выдачей файла после оплаты'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'isBase64Encoded': False,
            'body': '',
        }

    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', '')
    headers = event.get('headers') or {}

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except (ValueError, TypeError):
            body = {}

    conn = _db()
    try:
        if method == 'GET' and action == 'products':
            return _list_products(conn)
        if method == 'GET' and action == 'status':
            return _order_status(conn, qs)
        if method == 'POST' and action == 'create_order':
            return _create_order(conn, body)
        if method == 'POST' and action == 'click_webhook':
            return _click_webhook(conn, body)
        if method == 'POST' and action == 'payme_webhook':
            return _payme_webhook(conn, body, headers)
        return _cors(404, {'error': 'unknown_action'})
    finally:
        conn.close()
