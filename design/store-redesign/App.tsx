import { useState } from "react";

type Product = {
  id: string;
  name: string;
  detail: string;
  price: string;
  tag?: string;
  kind: "rice" | "lentil" | "oil";
};

const products: Product[] = [
  { id: "arroz", name: "Arroz extra Costeño", detail: "S/ 4.20 · kg", price: "S/ 4.20", tag: "Oferta", kind: "rice" },
  { id: "lenteja", name: "Lenteja bebé", detail: "S/ 9.80 · kg", price: "S/ 9.80", tag: "Nuevo", kind: "lentil" },
  { id: "aceite", name: "Aceite vegetal", detail: "Botella 1 L", price: "S/ 10.50", tag: "Sin stock", kind: "oil" },
];

function Icon({ name }: { name: "search" | "pin" | "home" | "grid" | "cart" | "user" | "minus" | "plus" }) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.1" /><path d="m16 16 4 4" /></>,
    pin: <><path d="M18.5 10c0 5-6.5 10.2-6.5 10.2S5.5 15 5.5 10a6.5 6.5 0 1 1 13 0Z" /><circle cx="12" cy="10" r="2" /></>,
    home: <><path d="m3.5 10 8.5-7 8.5 7v10.5H14v-6h-4v6H3.5Z" /></>,
    grid: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx=".7" /><rect x="14" y="3.5" width="6.5" height="6.5" rx=".7" /><rect x="3.5" y="14" width="6.5" height="6.5" rx=".7" /><rect x="14" y="14" width="6.5" height="6.5" rx=".7" /></>,
    cart: <><path d="M3 4h2l2.2 10.2h10.5L20 7H7" /><circle cx="9" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20c.8-4.1 3.3-6.2 7.5-6.2s6.7 2.1 7.5 6.2" /></>,
    minus: <path d="M6 12h12" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };
  return <svg className={`icon icon-${name}`} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function CategoryArt({ type }: { type: "rice" | "lentil" | "oil" | "pasta" }) {
  if (type === "oil") return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 7h10l-1.5 7h3.8l3.5 25H13.2l3.5-25h3.8Z" fill="currentColor" opacity=".22" /><path d="M19 7h10m-1.5 7H16.7m-3.5 25h21.6M24 18v15" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" /></svg>;
  if (type === "pasta") return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 12c10 1 14 23 24 24M20 8c-2 12 6 18 16 18M11 31c9 0 10-14 25-14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true"><g fill="currentColor"><ellipse cx="13" cy="13" rx="5" ry="3.4" transform="rotate(-28 13 13)" /><ellipse cx="28" cy="11" rx="5" ry="3.4" transform="rotate(18 28 11)" /><ellipse cx="37" cy="22" rx="5" ry="3.4" transform="rotate(-30 37 22)" /><ellipse cx="20" cy="26" rx="5" ry="3.4" transform="rotate(25 20 26)" /><ellipse cx="31" cy="36" rx="5" ry="3.4" transform="rotate(-16 31 36)" /><ellipse cx="11" cy="37" rx="5" ry="3.4" transform="rotate(18 11 37)" /></g></svg>;
}

function ProductArt({ kind }: { kind: Product["kind"] }) {
  return <div className={`product-art product-art-${kind}`} aria-hidden="true">
    {kind === "oil" ? <CategoryArt type="oil" /> : <CategoryArt type={kind} />}
    <span className="art-grain art-one" /><span className="art-grain art-two" /><span className="art-grain art-three" />
  </div>;
}

export default function App() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeFilter, setActiveFilter] = useState("Para tu despensa");
  const cartCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const updateQuantity = (id: string, change: number) => setQuantities((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + change) }));

  return (
    <main className="store-app">
      <header className="store-header">
        <div><p className="location-label"><Icon name="pin" /> Entrega en</p><h1>Santa Anita</h1></div>
        <a className="brand" href="#" aria-label="Cogana, inicio">Cogana<span>.</span></a>
      </header>

      <button className="search-bar" type="button"><Icon name="search" /><span>¿Qué se te antoja hoy?</span></button>

      <div className="delivery-strip"><span className="delivery-dot" /><strong>Llega hoy</strong><span>·</span><span>Entrega en 30 min</span><button type="button">Ver horarios</button></div>

      <section className="pantry-banner" aria-label="Básicos de casa">
        <div className="grain-pattern" />
        <div className="banner-copy"><p>Tu despensa</p><h2>Básicos de<br />casa</h2><button type="button">Descubrir <span>→</span></button></div>
        <div className="banner-still-life" aria-hidden="true"><div className="jute-bag"><span /><span /><span /><span /></div><div className="bag-label">ARROZ<br />EXTRA</div><div className="lentil-bowl" /></div>
      </section>

      <section className="category-section" aria-labelledby="categories-title">
        <div className="section-heading"><h2 id="categories-title">Compra por categoría</h2><button type="button">Ver todo</button></div>
        <div className="category-row">
          {[["Arroces", "rice"], ["Menestras", "lentil"], ["Aceites", "oil"], ["Fideos", "pasta"]].map(([label, type]) => <button className="category-item" type="button" key={label}><span className="category-art"><CategoryArt type={type as "rice" | "lentil" | "oil" | "pasta"} /></span>{label}</button>)}
        </div>
      </section>

      <section className="product-section" aria-labelledby="products-title">
        <div className="section-heading"><h2 id="products-title">Para tu despensa</h2><button type="button">Ver más</button></div>
        <div className="filter-row">{["Para tu despensa", "Ofertas", "Menestras"].map((filter) => <button onClick={() => setActiveFilter(filter)} className={activeFilter === filter ? "filter-chip active" : "filter-chip"} type="button" key={filter}>{filter}</button>)}</div>
        <div className="product-grid">
          {products.map((product) => {
            const quantity = quantities[product.id] ?? 0;
            const unavailable = product.tag === "Sin stock";
            return <article className="product-card" key={product.id}><div className="product-visual"><ProductArt kind={product.kind} />{product.tag && <span className={`product-tag ${unavailable ? "muted" : ""}`}>{product.tag}</span>}{!unavailable && <div className={quantity ? "quantity-control show" : "quantity-control"}>{quantity ? <><button onClick={() => updateQuantity(product.id, -1)} type="button" aria-label={`Quitar ${product.name}`}><Icon name="minus" /></button><span>{quantity}</span><button onClick={() => updateQuantity(product.id, 1)} type="button" aria-label={`Agregar otro ${product.name}`}><Icon name="plus" /></button></> : <button onClick={() => updateQuantity(product.id, 1)} type="button" aria-label={`Agregar ${product.name}`}><Icon name="plus" /></button>}</div>}</div><h3>{product.name}</h3><p>{product.detail}</p><strong>{product.price}</strong></article>;
          })}
        </div>
      </section>

      <nav className="tabbar" aria-label="Navegación principal">{[["Inicio", "home"], ["Categorías", "grid"], ["Carrito", "cart"], ["Cuenta", "user"]].map(([label, icon]) => <button type="button" className={label === "Inicio" ? "tab active" : "tab"} key={label}><span className="tab-icon"><Icon name={icon as "home" | "grid" | "cart" | "user"} />{label === "Carrito" && cartCount > 0 && <b>{cartCount}</b>}</span><span>{label}</span></button>)}</nav>
    </main>
  );
}
