// Single, clean admin script
(function(){
  const $ = s => document.querySelector(s);
  const API = '/api';

  // Elements
  const tabProducts = $('#tab-products');
  const tabBrands = $('#tab-brands');
  const tabOrders = $('#tab-orders');
  const tabSettings = $('#tab-settings');
  const productsSection = $('#products-section');
  const brandsSection = $('#brands-section');
  const ordersSection = $('#orders-section');
  const settingsSection = $('#settings-section');
  const pageTitle = $('#page-title');
  const btnRefresh = $('#btn-refresh');
  const openSite = $('#open-site');

  const form = $('#product-form');
  const titleEl = $('#title');
  const brandEl = $('#brand');
  const brandCustomWrap = $('#brand-custom-wrap');
  const brandCustom = $('#brand-custom');
  const descEl = $('#description');
  const priceEl = $('#price');
  const stockS = $('#stock_s');
  const stockM = $('#stock_m');
  const stockL = $('#stock_l');
  const stockXL = $('#stock_xl');
  const stockXXL = $('#stock_xxl');
  const imagesEl = $('#images');
  const previewEl = $('#preview');
  const productsList = $('#products-list');
  const saveBtn = $('#save-btn');
  const cancelEdit = $('#cancel-edit');
  const ordersList = $('#orders-list');

  let editingId = null;
  let retainedImages = []; // existing images kept during edit

  function showTab(tab){
    tabProducts.classList.remove('active'); tabOrders.classList.remove('active'); tabSettings.classList.remove('active');
    productsSection.hidden = true; ordersSection.hidden = true; settingsSection.hidden = true;
    if(tab==='products'){ tabProducts.classList.add('active'); productsSection.hidden=false; pageTitle.textContent='Ürün Yönetimi' }
    if(tab==='orders'){ tabOrders.classList.add('active'); ordersSection.hidden=false; pageTitle.textContent='Siparişler'; fetchOrders() }
    if(tab==='settings'){ tabSettings.classList.add('active'); settingsSection.hidden=false; pageTitle.textContent='Ayarlar' }
  }

  tabProducts.addEventListener('click', ()=> showTab('products'));
  tabBrands.addEventListener('click', ()=> showTab('brands'));
  tabOrders.addEventListener('click', ()=> showTab('orders'));
  tabSettings.addEventListener('click', ()=> showTab('settings'));

  // Image previews with removal support
  function renderExistingImages(){
    previewEl.innerHTML = '';
    // Existing (retained) images
    retainedImages.forEach(src => {
      const wrap = document.createElement('div'); wrap.className='img-wrap';
      const img = document.createElement('img'); img.src = src; wrap.appendChild(img);
      const btn = document.createElement('button'); btn.type='button'; btn.className='remove-img'; btn.textContent='×';
      btn.addEventListener('click', ()=>{ retainedImages = retainedImages.filter(i=> i!==src); renderExistingImages(); });
      wrap.appendChild(btn);
      previewEl.appendChild(wrap);
    });
    // Newly selected files (not yet uploaded)
    Array.from(imagesEl.files || []).forEach(f => {
      const wrap = document.createElement('div'); wrap.className='img-wrap';
      const img = document.createElement('img'); img.src = URL.createObjectURL(f); wrap.appendChild(img);
      previewEl.appendChild(wrap);
    });
  }
  imagesEl.addEventListener('change', renderExistingImages);

  function parseImagesField(images){ if(!images) return []; if(Array.isArray(images)) return images; try{ return JSON.parse(images) }catch(e){ return String(images).split(',').map(s=>s.trim()).filter(Boolean) } }

  async function fetchProducts(){ try{ const r = await fetch(API + '/products'); if(!r.ok) throw new Error('network'); return r.json(); }catch(e){ console.error(e); return [] } }

  function buildBrands(brands){ const defaults = ['Prada','Gucci','Chanel','Boss','Armani']; const merged = Array.from(new Set([...defaults,...brands])); brandEl.innerHTML = '<option value="">-- Marka seçin --</option>' + merged.map(b=>`<option value="${b}">${b}</option>`).join('') + '<option value="__other__">Diğer (elle)</option>'; }

  // Fetch brands from server and combine with product-derived brands
  async function fetchBrands(){ try{ const r = await fetch(API + '/brands'); if(!r.ok) throw new Error('brands'); const data = await r.json(); return (data||[]).map(b=>({ id: b.id, name: b.name })); }catch(e){ console.error('fetchBrands', e); return [] } }

  // Render brands management panel
  async function renderBrandsPanel(){ const list = $('#brands-list'); list.innerHTML = '<div class="muted">Yükleniyor...</div>'; const brands = await fetchBrands(); if(!brands.length){ list.innerHTML = '<div class="muted">Henüz marka yok.</div>'; return } list.innerHTML = ''; brands.forEach(b=>{ const row = document.createElement('div'); row.className = 'product-item'; const nameEl = document.createElement('div'); nameEl.className = 'product-meta'; nameEl.innerHTML = `<strong>${b.name}</strong>`; const actions = document.createElement('div'); actions.className='product-actions'; const del = document.createElement('button'); del.textContent='Sil'; del.style.background='#e53935'; del.addEventListener('click', ()=> deleteBrand(b.id)); actions.appendChild(del); row.appendChild(nameEl); row.appendChild(actions); list.appendChild(row); }); }

  async function addBrand(name){ if(!name || !name.trim()) return alert('Marka adı girin'); try{ const r = await fetch(API + '/brands', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: name.trim() }) }); if(!r.ok) throw new Error('add brand'); await renderBrandsPanel(); await renderProducts(); alert('Marka eklendi'); }catch(e){ console.error(e); alert('Marka eklenemedi'); } }

  async function deleteBrand(id){ if(!confirm('Bu markayı silmek istediğinize emin misiniz? Ürünler bu işlemle etkilenmez.')) return; try{ const r = await fetch(API + '/brands/' + id, { method: 'DELETE' }); if(!r.ok) throw new Error('delete brand'); await renderBrandsPanel(); await renderProducts(); }catch(e){ console.error(e); alert('Silme başarısız'); } }

  async function renderProducts(){
    productsList.innerHTML = '<div class="muted">Yükleniyor...</div>';
    const products = await fetchProducts();
    const serverBrands = (await fetchBrands()).map(b=>b.name).filter(Boolean);
    if(!products || products.length===0){
      productsList.innerHTML = '<div class="muted">Henüz ürün yok.</div>';
      buildBrands(serverBrands);
      return;
    }
    productsList.innerHTML = '';
    products.forEach(p=>{
      const item = document.createElement('div'); item.className='product-item';
      const imgs = parseImagesField(p.images);
      const thumb = document.createElement('img'); thumb.src = imgs[0] || '/images/showcase/placeholder.png';
  const meta = document.createElement('div'); meta.className='product-meta';
  // build stock summary
  const stock = p.stock || {};
  const totalStock = Object.values(stock).reduce((s,v)=>s + (Number(v)||0), 0);
  let stockSummary = totalStock > 0 ? ` • Stok: ${totalStock}` : '';
  // optional per-size small indicator
  const small = `<div class='muted'>${p.brand} • ${Number(p.price||0).toFixed(2)} TL${stockSummary}</div>`;
  meta.innerHTML = `<strong>${p.title}</strong>${small}`;
      const actions = document.createElement('div'); actions.className='product-actions';
      const edit = document.createElement('button'); edit.textContent='Düzenle'; edit.addEventListener('click', ()=> fillFormForEdit(p));
      const del = document.createElement('button'); del.textContent='Sil'; del.style.background='#e53935'; del.addEventListener('click', ()=> deleteProduct(p.id));
      actions.appendChild(edit); actions.appendChild(del);
      item.appendChild(thumb); item.appendChild(meta); item.appendChild(actions);
      productsList.appendChild(item);
    });
    const brands = Array.from(new Set([...(products.map(p=>p.brand).filter(Boolean)), ...serverBrands]));
    buildBrands(brands);
  }
  

  function fillFormForEdit(p){
    editingId = p.id;
    $('#form-title').textContent='Ürünü Düzenle';
    titleEl.value = p.title || '';
    buildBrands([p.brand]);
    if(p.brand && !Array.from(brandEl.options).some(o=>o.value===p.brand)){
      const opt = document.createElement('option'); opt.value = p.brand; opt.textContent = p.brand; brandEl.appendChild(opt);
    }
    brandEl.value = p.brand || '';
    if(!brandEl.value){ brandEl.value='__other__'; brandCustomWrap.style.display='block'; brandCustom.value = p.brand || ''; }
    descEl.value = p.description || '';
    priceEl.value = p.price || '';
    // populate per-size stock
    const stock = p.stock || {};
    stockS.value = Number(stock.S || 0);
    stockM.value = Number(stock.M || 0);
    stockL.value = Number(stock.L || 0);
    stockXL.value = Number(stock.XL || 0);
    stockXXL.value = Number(stock.XXL || 0);
    const imgs = parseImagesField(p.images);
    retainedImages = imgs.slice();
    renderExistingImages();
    cancelEdit.hidden = false; saveBtn.textContent = 'Güncelle';
  }

  cancelEdit.addEventListener('click', ()=> resetForm());
  function resetForm(){ editingId = null; form.reset(); retainedImages = []; previewEl.innerHTML=''; $('#form-title').textContent='Yeni Ürün Ekle'; cancelEdit.hidden=true; saveBtn.textContent='Kaydet'; brandCustomWrap.style.display='none'; }

  brandEl.addEventListener('change', ()=>{ if(brandEl.value === '__other__'){ brandCustomWrap.style.display='block'; } else { brandCustomWrap.style.display='none'; } });

  async function deleteProduct(id){ if(!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return; try{ const r = await fetch(API + '/products/' + id, { method: 'DELETE' }); if(!r.ok) throw new Error('silme'); await renderProducts(); }catch(e){ alert('Silme başarısız'); console.error(e) } }

  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    saveBtn.disabled = true; saveBtn.textContent = editingId ? 'Güncelleniyor...' : 'Kaydediliyor...';
    const fd = new FormData();
    const brandValue = brandEl.value === '__other__' ? (brandCustom.value.trim() || 'Diğer') : brandEl.value;
    fd.append('title', titleEl.value.trim());
    fd.append('brand', brandValue);
    fd.append('description', descEl.value.trim());
    fd.append('price', priceEl.value || 0);
    // collect size stocks
    const stockObj = {
      S: Number(stockS.value || 0),
      M: Number(stockM.value || 0),
      L: Number(stockL.value || 0),
      XL: Number(stockXL.value || 0),
      XXL: Number(stockXXL.value || 0)
    };
    fd.append('stock', JSON.stringify(stockObj));
  if (editingId) fd.append('existingImages', JSON.stringify(retainedImages));
  Array.from(imagesEl.files || []).forEach(f=> fd.append('images', f));
    try{
      const url = editingId ? API + '/products/' + editingId : API + '/products';
      const method = editingId ? 'PUT' : 'POST';
      const r = await fetch(url, { method, body: fd });
      if(!r.ok){ const t = await r.text(); throw new Error(t || 'server error'); }
      resetForm(); await renderProducts(); alert(editingId ? 'Ürün güncellendi' : 'Ürün eklendi');
    }catch(e){ console.error('submit', e); alert('Kayıt sırasında hata oluştu. Konsolu kontrol edin.'); }
    saveBtn.disabled = false; saveBtn.textContent = 'Kaydet';
  });

  async function fetchOrders(){ ordersList.innerHTML = '<div class="muted">Yükleniyor...</div>'; try{ const r = await fetch(API + '/orders'); if(!r.ok) throw new Error('orders'); const data = await r.json(); renderOrders(data || []); }catch(e){ ordersList.innerHTML = '<div class="muted">Siparişler yüklenemedi.</div>'; console.error(e) } }

  function renderOrders(orders){ if(!orders.length){ ordersList.innerHTML = '<div class="muted">Henüz sipariş yok.</div>'; return } ordersList.innerHTML = ''; const c = document.createElement('div'); c.className='orders-list'; orders.reverse().forEach(o=>{ const el = document.createElement('div'); el.className='order card'; el.innerHTML = `<h4>Sipariş #${o.id} <span class="muted">${o.created_at ? new Date(o.created_at).toLocaleString() : ''}</span></h4><div class="muted">Toplam: ${Number(o.total||0).toFixed(2)} TL • ${o.status || 'yeni'}</div><pre style="white-space:pre-wrap">${JSON.stringify(o.items || [], null, 2)}</pre>`; c.appendChild(el); }); ordersList.appendChild(c); }

  btnRefresh.addEventListener('click', ()=> renderProducts());

  // Brands UI handlers
  $('#btn-add-brand').addEventListener('click', ()=>{ const v = $('#new-brand-name').value || ''; addBrand(v); $('#new-brand-name').value = ''; });


  // init
  (async ()=>{ await renderProducts(); showTab('products'); })();

  // When brands tab shown, render brands
  async function handleTabSwitch(name){ if(name === 'brands'){ await renderBrandsPanel(); } }

  // enhance showTab to call brand render
  const _showTab = showTab; showTab = function(tab){ _showTab(tab); handleTabSwitch(tab); };

})();
