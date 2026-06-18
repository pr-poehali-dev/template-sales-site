import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import PaymentDialog, { PayProduct } from '@/components/PaymentDialog';

const API = 'https://functions.poehali.dev/47f33681-2804-4f21-b201-428ab6b83c08';

const HERO_IMG =
  'https://cdn.poehali.dev/projects/4570fccf-7908-4cdf-9532-381e77025ae5/files/558a48f0-2d92-4aa4-817e-6f90805d69b3.jpg';

const NAV = [
  { id: 'home', label: 'Главная' },
  { id: 'catalog', label: 'Каталог' },
  { id: 'about', label: 'О нас' },
  { id: 'contacts', label: 'Контакты' },
];

const CARD_COLORS = ['bg-primary', 'bg-secondary', 'bg-accent'];

interface Product {
  id: number;
  title: string;
  description: string;
  emoji: string;
  tag: string;
  price_uzs: number;
}

const STEPS = [
  { icon: 'MousePointerClick', title: 'Выбираете шаблон', text: 'Листаете каталог и кладёте в корзину то, что нравится.' },
  { icon: 'CreditCard', title: 'Оплачиваете онлайн', text: 'Быстрая безопасная оплата картой за пару секунд.' },
  { icon: 'Download', title: 'Скачиваете файл', text: 'Доступ к скачиванию открывается сразу после оплаты.' },
];

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<PayProduct | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}?action=products`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  const buy = (p: Product) => {
    setSelected({ id: p.id, title: p.title, emoji: p.emoji, price_uzs: p.price_uzs });
    setPayOpen(true);
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-border">
        <div className="container flex items-center justify-between py-3">
          <button onClick={() => scrollTo('home')} className="flex items-center gap-2">
            <span className="text-3xl animate-wiggle inline-block">🚀</span>
            <span className="font-hand text-2xl text-primary">УмныйЁжик</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="px-4 py-2 rounded-full font-display font-bold text-foreground/80 hover:text-primary hover:bg-muted transition-colors"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" className="rounded-full border-2 font-display font-bold gap-2">
              <Icon name="User" size={18} /> Кабинет
            </Button>
            <Button className="rounded-full font-display font-bold gap-2 shadow-lg shadow-primary/30">
              <Icon name="ShoppingCart" size={18} /> Корзина
            </Button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? 'X' : 'Menu'} size={28} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t-2 border-border bg-background px-4 py-3 flex flex-col gap-1 animate-fade-in">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="text-left px-4 py-2 rounded-xl font-display font-bold hover:bg-muted"
              >
                {n.label}
              </button>
            ))}
            <Button className="rounded-full font-display font-bold mt-2 gap-2">
              <Icon name="User" size={18} /> Личный кабинет
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative dotted-bg">
        <div className="container grid md:grid-cols-2 gap-8 items-center py-12 md:py-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 bg-accent/30 text-accent-foreground font-display font-bold px-4 py-1.5 rounded-full text-sm mb-5">
              🎉 Скачивание сразу после оплаты
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-5">
              Развивающие <span className="text-gradient">прописи и игры</span> для ваших детей
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Готовые электронные шаблоны для печати. Учим буквы, цифры и логику легко, ярко и с удовольствием!
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => scrollTo('catalog')} size="lg" className="rounded-full font-display font-bold text-lg gap-2 shadow-xl shadow-primary/30 h-14 px-8">
                Смотреть каталог <Icon name="ArrowRight" size={20} />
              </Button>
              <Button onClick={() => scrollTo('about')} variant="outline" size="lg" className="rounded-full border-2 font-display font-bold text-lg h-14 px-8">
                Как это работает
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8">
              <div>
                <div className="font-display font-extrabold text-2xl text-primary">5000+</div>
                <div className="text-sm text-muted-foreground">довольных семей</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="font-display font-extrabold text-2xl text-secondary">50+</div>
                <div className="text-sm text-muted-foreground">шаблонов</div>
              </div>
            </div>
          </div>

          <div className="relative animate-float">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-accent/20 to-secondary/20 rounded-[3rem] blur-2xl" />
            <img
              src={HERO_IMG}
              alt="Дети учатся писать"
              className="relative rounded-[2.5rem] border-4 border-white shadow-2xl w-full"
            />
            <div className="absolute -top-4 -right-2 bg-white rounded-2xl shadow-xl px-4 py-2 font-display font-bold rotate-6 border-2 border-accent">
              ⭐ 4.9 / 5
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="container py-16">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-3">Каталог шаблонов</h2>
          <p className="text-muted-foreground text-lg">Выбирайте, оплачивайте и скачивайте за минуту 👇</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <div
              key={p.id}
              className="group bg-card rounded-[2rem] border-2 border-border p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`${CARD_COLORS[i % 3]} w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5 group-hover:animate-wiggle`}>
                {p.emoji}
              </div>
              <span className="inline-block bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full mb-3">
                {p.tag}
              </span>
              <h3 className="font-display font-bold text-xl mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-sm mb-5">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-xl text-primary">
                  {p.price_uzs.toLocaleString('ru-RU')} сум
                </span>
                <Button onClick={() => buy(p)} className="rounded-full font-display font-bold gap-2 shadow-lg shadow-primary/20">
                  <Icon name="ShoppingCart" size={18} /> Купить
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works / About */}
      <section id="about" className="bg-secondary/10 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-3">Как получить файл</h2>
            <p className="text-muted-foreground text-lg">Всего 3 простых шага — и материалы у вас!</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative bg-card rounded-[2rem] border-2 border-border p-8 text-center">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-accent rounded-full flex items-center justify-center font-display font-extrabold text-accent-foreground border-2 border-white shadow">
                  {i + 1}
                </div>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mt-2">
                  <Icon name={s.icon} size={30} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-card rounded-[2.5rem] border-2 border-border p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl mb-4">О нас 💛</h3>
              <p className="text-muted-foreground mb-4">
                Мы — команда педагогов и родителей. Создаём яркие развивающие материалы, которые превращают обучение в любимую игру.
              </p>
              <ul className="space-y-3">
                {['Готово к печати дома', 'Проверено педагогами', 'Доступ навсегда после оплаты'].map((t) => (
                  <li key={t} className="flex items-center gap-3 font-semibold">
                    <span className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white shrink-0">
                      <Icon name="Check" size={14} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['🎓', 'Опытные педагоги'], ['⚡', 'Мгновенно'], ['🖨️', 'Печать дома'], ['♾️', 'Доступ навсегда']].map(([e, t]) => (
                <div key={t} className="bg-muted rounded-2xl p-5 text-center">
                  <div className="text-3xl mb-2">{e}</div>
                  <div className="font-display font-bold text-sm">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="container py-16">
        <div className="bg-gradient-to-br from-primary to-accent rounded-[2.5rem] p-8 md:p-14 text-center text-white relative overflow-hidden">
          <div className="absolute top-4 left-6 text-5xl opacity-30 animate-float">✏️</div>
          <div className="absolute bottom-6 right-8 text-5xl opacity-30 animate-float" style={{ animationDelay: '1s' }}>🎨</div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-3 relative">Остались вопросы?</h2>
          <p className="text-white/90 text-lg mb-8 relative">Напишите нам — поможем подобрать материалы для вашего малыша!</p>
          <div className="flex flex-wrap justify-center gap-3 relative">
            <Button size="lg" variant="secondary" className="rounded-full font-display font-bold gap-2 h-14 px-7">
              <Icon name="Mail" size={20} /> hello@umnyozhik.ru
            </Button>
            <Button size="lg" variant="secondary" className="rounded-full font-display font-bold gap-2 h-14 px-7">
              <Icon name="Phone" size={20} /> +7 (900) 000-00-00
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="font-hand text-xl text-primary">УмныйЁжик</span>
          </div>
          <p className="text-sm">© 2026 УмныйЁжик. Развивающие материалы для детей.</p>
          <div className="flex gap-3">
            {['Send', 'Instagram', 'Youtube'].map((ic) => (
              <button key={ic} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>
      </footer>

      <PaymentDialog product={selected} open={payOpen} onClose={() => setPayOpen(false)} />
    </div>
  );
};

export default Index;