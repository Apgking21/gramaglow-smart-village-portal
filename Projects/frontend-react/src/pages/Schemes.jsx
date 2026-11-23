import { useEffect, useState } from 'react';
export default function Schemes() {
  const [items,setItems]=useState([]); const [error,setError]=useState('');
  useEffect(()=>{let active=true;fetch('/api/schemes').then(r=>{if(!r.ok)throw Error('Unable to load schemes');return r.json();}).then(d=>{if(active)setItems(d.schemes||[]);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
  return <><h1>Government schemes</h1>{error&&<p role="alert">{error}</p>}<div className="cards">{items.map(s=><article className="card" key={s.id}><span className="tag">{s.category}</span><h2>{s.name_en}</h2><p>{s.department_en}</p><p><strong>Financial assistance:</strong> {s.financial_aid_en}</p><p><strong>Eligibility:</strong> {s.eligibility_en}</p>{s.apply_url&&<a href={s.apply_url} target="_blank" rel="noreferrer">Official application information ↗</a>}</article>)}</div></>;
}
