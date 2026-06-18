import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/47f33681-2804-4f21-b201-428ab6b83c08';

export interface PayProduct {
  id: number;
  title: string;
  emoji: string;
  price_uzs: number;
}

interface Props {
  product: PayProduct | null;
  open: boolean;
  onClose: () => void;
}

type Stage = 'choose' | 'waiting' | 'paid';

const PaymentDialog = ({ product, open, onClose }: Props) => {
  const [stage, setStage] = useState<Stage>('choose');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<'' | 'click' | 'payme'>('');
  const [fileUrl, setFileUrl] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setStage('choose');
      setEmail('');
      setLoading('');
      setFileUrl('');
      setError('');
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open]);

  const startPolling = (token: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API}?action=status&order_token=${token}`);
        const d = await r.json();
        if (d.status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current);
          setFileUrl(d.file_url);
          setStage('paid');
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  };

  const pay = async (provider: 'click' | 'payme') => {
    if (!product) return;
    setLoading(provider);
    setError('');
    try {
      const res = await fetch(`${API}?action=create_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          provider,
          email,
          return_url: window.location.href,
        }),
      });
      const data = await res.json();
      if (!data.pay_url) {
        setError('Не удалось создать заказ. Попробуйте позже.');
        setLoading('');
        return;
      }
      window.open(data.pay_url, '_blank');
      setStage('waiting');
      startPolling(data.order_token);
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.');
    }
    setLoading('');
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-[2rem] border-2 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-extrabold text-2xl flex items-center gap-2">
            <span className="text-3xl">{product.emoji}</span> {product.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {(product.price_uzs).toLocaleString('ru-RU')} сум
          </DialogDescription>
        </DialogHeader>

        {stage === 'choose' && (
          <div className="space-y-4 pt-2">
            <Input
              type="email"
              placeholder="Email для чека (необязательно)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-2 h-12"
            />
            <p className="text-sm text-muted-foreground font-semibold">Выберите способ оплаты:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => pay('click')}
                disabled={!!loading}
                className="h-16 rounded-2xl font-display font-bold text-lg bg-[#00aaff] hover:bg-[#0095e0] text-white"
              >
                {loading === 'click' ? <Icon name="Loader2" className="animate-spin" /> : 'Click'}
              </Button>
              <Button
                onClick={() => pay('payme')}
                disabled={!!loading}
                className="h-16 rounded-2xl font-display font-bold text-lg bg-[#33b3ff] hover:bg-[#1aa0f0] text-white"
              >
                {loading === 'payme' ? <Icon name="Loader2" className="animate-spin" /> : 'Payme'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
          </div>
        )}

        {stage === 'waiting' && (
          <div className="text-center py-8 space-y-4">
            <Icon name="Loader2" size={48} className="animate-spin mx-auto text-primary" />
            <p className="font-display font-bold text-lg">Ожидаем оплату…</p>
            <p className="text-sm text-muted-foreground">
              Завершите оплату в открывшемся окне. Как только платёж пройдёт, здесь появится кнопка скачивания.
            </p>
          </div>
        )}

        {stage === 'paid' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center text-white animate-pop">
              <Icon name="Check" size={40} />
            </div>
            <p className="font-display font-extrabold text-xl">Оплата прошла! 🎉</p>
            <p className="text-sm text-muted-foreground">Ваш файл готов к скачиванию.</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
              <Button className="w-full h-14 rounded-2xl font-display font-bold text-lg gap-2 shadow-lg shadow-primary/30">
                <Icon name="Download" size={20} /> Скачать файл
              </Button>
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
