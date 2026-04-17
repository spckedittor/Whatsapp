// Supabase bağlantısı
const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listeDiv = document.getElementById('kullanici-liste');
const aramaInput = document.getElementById('arama-input');

let tumKullanicilar = [];
let benimId = localStorage.getItem('kullanici_id');
let benimAdim = localStorage.getItem('kullanici_adi');

let arkadasIdleri = new Set();

function temaKontrol() {
  if (localStorage.getItem('toggleState') === 'on') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

temaKontrol();
window.addEventListener('storage', () => { temaKontrol(); });

async function arkadaslariGetir() {
  const { data, error } = await supabaseClient
    .from('arkadaslar')
    .select('arkadas_id')
    .eq('kullanici_id', benimId);
  
  if (!error && data) {
    arkadasIdleri.clear();
    data.forEach(row => arkadasIdleri.add(row.arkadas_id));
  }
}

async function arkadasEkle(arkadasId, arkadasAdi) {
  const { error } = await supabaseClient
    .from('arkadaslar')
    .insert({
      kullanici_id: benimId,
      arkadas_id: arkadasId,
      arkadas_adi: arkadasAdi
    });
  
  if (error) {
    if (error.code === '23505') {
      alert('Bu kullanıcı zaten arkadaşınız!');
    } else {
      alert('Arkadaş eklenirken hata oluştu: ' + error.message);
    }
    return false;
  }
  
  arkadasIdleri.add(arkadasId);
  alert('✅ ' + arkadasAdi + ' arkadaşlarınıza eklendi!');
  return true;
}

async function kullanicilariGetir() {
  listeDiv.innerHTML = '<div class="yukleniyor">Yükleniyor...</div>';
  
  try {
    await arkadaslariGetir();
    
    const { data: mesajlar, error: mesajHata } = await supabaseClient
      .from('spckedittorsapi')
      .select('kullanici_id, kullanici_adi');
    
    if (mesajHata) console.error('Mesaj hatası:', mesajHata);
    
    const mesajAtanlar = [];
    const mesajIdleri = new Set();
    
    if (mesajlar && mesajlar.length > 0) {
      mesajlar.forEach(m => {
        if (!mesajIdleri.has(m.kullanici_id) && m.kullanici_id !== benimId) {
          mesajIdleri.add(m.kullanici_id);
          mesajAtanlar.push({
            id: m.kullanici_id,
            kullanici_adi: m.kullanici_adi || 'İsimsiz',
            kaynak: 'mesaj'
          });
        }
      });
    }
    
    const { data: kayitlilar, error: kayitHata } = await supabaseClient
      .from('kullanicilar')
      .select('*');
    
    if (kayitHata) console.error('Kayıt hatası:', kayitHata);
    
    const kayitliKullanicilar = [];
    if (kayitlilar && kayitlilar.length > 0) {
      kayitlilar.forEach(k => {
        if (k.id !== benimId && !mesajIdleri.has(k.id)) {
          kayitliKullanicilar.push({
            id: k.id,
            kullanici_adi: k.kullanici_adi,
            kaynak: 'kayit'
          });
        }
      });
    }
    
    const tumListe = [...mesajAtanlar, ...kayitliKullanicilar];
    tumKullanicilar = tumListe.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    if (tumKullanicilar.length > 0) {
      kullanicilariGoster(tumKullanicilar);
    } else {
      listeDiv.innerHTML = '<div class="yukleniyor">Henüz başka kullanıcı yok.</div>';
    }
  } catch (err) {
    console.error('Hata:', err);
    listeDiv.innerHTML = '<div class="yukleniyor">Kullanıcılar yüklenirken hata oluştu.</div>';
  }
}

function kullanicilariGoster(kullanicilar) {
  if (!kullanicilar.length) {
    listeDiv.innerHTML = '<div class="yukleniyor">Kullanıcı bulunamadı.</div>';
    return;
  }
  
  listeDiv.innerHTML = '';
  
  kullanicilar.forEach(k => {
    const item = document.createElement('div');
    item.className = 'kullanici-item';
    const renk = Math.abs(k.kullanici_adi.charCodeAt(0) % 360);
    
    const zatenArkadas = arkadasIdleri.has(k.id);
    
    item.innerHTML = `
            <div class="kullanici-avatar" style="background: hsl(${renk}, 70%, 55%);">
                ${k.kullanici_adi.charAt(0).toUpperCase()}
            </div>
            <div class="kullanici-bilgi">
                <div class="kullanici-isim">${k.kullanici_adi}</div>
                <div class="kullanici-durum">🟢 Çevrimiçi</div>
            </div>
            <button class="arkadas-butonu ${zatenArkadas ? 'eklendi' : ''}" data-id="${k.id}" data-ad="${k.kullanici_adi}">
                ${zatenArkadas ? '💬 Mesaj Gönder' : '+ Arkadaş Ekle'}
            </button>
        `;
    
    const arkadasBtn = item.querySelector('.arkadas-butonu');
    arkadasBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = arkadasBtn.dataset.id;
      const ad = arkadasBtn.dataset.ad;
      
      if (arkadasBtn.classList.contains('eklendi')) {
        // Zaten arkadaşsa mesaj gönder
        localStorage.setItem('mesajlasilan_kullanici', ad);
        localStorage.setItem('mesajlasilan_id', id);
        window.location.href = 'index.html';
      } else {
        // Arkadaş ekle
        await arkadasEkle(id, ad);
        arkadasBtn.classList.add('eklendi');
        arkadasBtn.textContent = '💬 Mesaj Gönder';
      }
    });
    
    item.onclick = () => {
      localStorage.setItem('mesajlasilan_kullanici', k.kullanici_adi);
      localStorage.setItem('mesajlasilan_id', k.id);
      window.location.href = 'index.html';
    };
    
    listeDiv.appendChild(item);
  });
}

if (aramaInput) {
  aramaInput.addEventListener('input', async (e) => {
    const aranan = e.target.value.toLowerCase().trim();
    
    if (aranan === '') {
      kullanicilariGetir();
    } else {
      const { data: mesajlar } = await supabaseClient
        .from('spckedittorsapi')
        .select('kullanici_id, kullanici_adi')
        .ilike('kullanici_adi', `%${aranan}%`);
      
      const { data: kayitlilar } = await supabaseClient
        .from('kullanicilar')
        .select('*')
        .ilike('kullanici_adi', `%${aranan}%`);
      
      const sonuclar = [];
      const ids = new Set();
      
      if (mesajlar) {
        mesajlar.forEach(m => {
          if (!ids.has(m.kullanici_id) && m.kullanici_id !== benimId) {
            ids.add(m.kullanici_id);
            sonuclar.push({
              id: m.kullanici_id,
              kullanici_adi: m.kullanici_adi,
              kaynak: 'mesaj'
            });
          }
        });
      }
      
      if (kayitlilar) {
        kayitlilar.forEach(k => {
          if (!ids.has(k.id) && k.id !== benimId) {
            ids.add(k.id);
            sonuclar.push({
              id: k.id,
              kullanici_adi: k.kullanici_adi,
              kaynak: 'kayit'
            });
          }
        });
      }
      
      if (sonuclar.length > 0) {
        kullanicilariGoster(sonuclar);
      } else {
        listeDiv.innerHTML = '<div class="yukleniyor">Kullanıcı bulunamadı.</div>';
      }
    }
  });
}

kullanicilariGetir();