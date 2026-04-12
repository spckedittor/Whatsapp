// ==================== SUPABASE (GLOBAL) ====================
window.supabaseClient = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase bağlandı');
} else {
  console.warn('⚠️ Supabase CDN yüklenemedi');
}

// ==================== KULLANICI BİLGİLERİ ====================
const BENIM_ADIM = localStorage.getItem('kullanici_adi') || 'Misafir';
const BENIM_ID = localStorage.getItem('kullanici_id') || 'misafir_' + Math.random().toString(36).substr(2, 9);

console.log('👤 Hoş geldin:', BENIM_ADIM);
console.log('🆔 ID:', BENIM_ID);

// ==================== AYARLAR ====================
const checkbox = document.getElementById("yakala");
const MESAJ_ANAHTARI = 'sohbet_mesajlari';

// ==================== TEMA ====================
function guncelle() {
  if (checkbox && checkbox.checked) {
    document.body.style.backgroundImage = "url('oyy.jpeg')";
    document.body.classList.add("dark");
    localStorage.setItem("toggleState", "on");
  } else if (checkbox) {
    document.body.style.backgroundImage = "url('olo.jpeg')";
    document.body.classList.remove("dark");
    localStorage.setItem("toggleState", "off");
  }
}

if (checkbox) {
  if (localStorage.getItem("toggleState") === "on") checkbox.checked = true;
  guncelle();
  checkbox.addEventListener("change", guncelle);
}

// ==================== YAZIYOR ====================
const input = document.querySelector(".input");
const yaziyor = document.getElementById("yaziyor");
let yazmaTimeout;

if (input) {
  input.addEventListener("input", () => {
    if (yaziyor) yaziyor.style.display = "block";
    clearTimeout(yazmaTimeout);
    yazmaTimeout = setTimeout(() => {
      if (yaziyor) yaziyor.style.display = "none";
    }, 1000);
  });
}

// ==================== MESAJ SİSTEMİ ====================
const govde = document.querySelector('.govde');
const ucakBtn = document.querySelector('.ucak');

const db = {
  kaydet: function(mesajlar) {
    localStorage.setItem(MESAJ_ANAHTARI, JSON.stringify(mesajlar));
  },
  yukle: function() {
    const data = localStorage.getItem(MESAJ_ANAHTARI);
    return data ? JSON.parse(data) : [];
  }
};

function mesajOlustur(mesaj) {
  const div = document.createElement('div');
  const benimMi = mesaj.gonderen === BENIM_ID;
  
  // Eski class sistemine dön
  div.className = `mesaj ${benimMi ? 'ben' : 'karsi'}`;
  
  const saat = new Date(mesaj.zaman).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Gösterilecek isim: kendi mesajınsa "Sen", değilse atan kişinin adı
  const gosterilenAd = benimMi ? 'Sen' : (mesaj.ad || mesaj.kullanici_adi || 'Anonim');
  
  let icerikHTML;
  if (mesaj.tip === 'foto' && mesaj.foto) {
    icerikHTML = `<img src="${mesaj.foto}" style="max-width: 200px; max-height: 200px; border-radius: 10px; display: block; margin-bottom: 5px;">`;
  } else {
    icerikHTML = `<div class="mesaj-icerik">${mesaj.metin}</div>`;
  }
  
  div.innerHTML = `
    <div class="mesaj-baslik">${gosterilenAd}</div>
    ${icerikHTML}
    <div class="mesaj-saat">${saat}</div>
  `;
  
  return div;
}

function mesajlariGoster() {
  if (!govde) return;
  govde.innerHTML = '';
  const mesajlar = db.yukle();
  
  mesajlar.forEach(m => {
    govde.appendChild(mesajOlustur(m));
  });
  
  govde.scrollTop = govde.scrollHeight;
}

async function mesajGonder() {
  if (!input) return;
  const metin = input.value.trim();
  if (!metin) return;
  
  console.log('Mesaj gönderiliyor:', metin);
  
  if (window.supabaseClient) {
    try {
      await window.supabaseClient.from('spckedittorsapi').insert([
        {
          kullanici_id: BENIM_ID,
          kullanici_adi: BENIM_ADIM,
          mesaj_icerik: metin,
          tip: 'metin'
        }
      ]);
      console.log('✅ Supabase\'e gönderildi');
      input.value = ''; // input temizlendi
    } catch (err) {
      console.error('❌ Supabase hatası:', err);
    }
  }
}

// GERÇEK ZAMANLI
if (window.supabaseClient) {
  window.supabaseClient
    .channel('spckedittorsapi')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'spckedittorsapi' }, payload => {
      console.log('📨 Yeni mesaj geldi:', payload.new);
      const yeni = payload.new;
      
      const mesajlar = db.yukle();
      mesajlar.push({
        id: yeni.id,
        metin: yeni.mesaj_icerik,
        gonderen: yeni.kullanici_id,
        ad: yeni.kullanici_adi || 'Anonim',
        zaman: yeni.gonderim_tarihi || new Date().toISOString()
      });
      db.kaydet(mesajlar);
      mesajlariGoster();
    })
    .subscribe();
  console.log('✅ Realtime dinleme başladı');
}

// Sayfa açılınca Supabase'deki son mesajları getir
async function sonMesajlariGetir() {
  if (!window.supabaseClient) return;
  
  const { data, error } = await window.supabaseClient
    .from('spckedittorsapi')
    .select('*')
    .order('id', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Hata:', error);
    return;
  }
  
  if (data && data.length > 0) {
    const mesajlar = db.yukle();
    let yeniMesajVar = false;
    
    data.reverse().forEach(supMesaj => {
      const varMi = mesajlar.some(m => m.id == supMesaj.id);
      if (!varMi) {
        mesajlar.push({
          id: supMesaj.id,
          metin: supMesaj.mesaj_icerik,
          gonderen: supMesaj.kullanici_id,
          ad: supMesaj.kullanici_adi || 'Anonim',
          zaman: supMesaj.gonderim_tarihi || new Date().toISOString()
        });
        yeniMesajVar = true;
      }
    });
    
    if (yeniMesajVar) {
      db.kaydet(mesajlar);
      mesajlariGoster();
    }
  }
}

mesajlariGoster();
sonMesajlariGetir();

// Üstteki isim alanını güncelle
const isimAlani = document.getElementById('karsiAd');
if (isimAlani) {
    isimAlani.textContent = BENIM_ADIM;
}

// ==================== FOTOĞRAF ====================
const kameraBtn = document.querySelector('.kamera');

if (kameraBtn) {
  kameraBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async function(event) {
        const fotoBase64 = event.target.result;
        
        if (window.supabaseClient) {
          try {
            await window.supabaseClient.from('spckedittorsapi').insert([
              {
                kullanici_id: BENIM_ID,
                kullanici_adi: BENIM_ADIM,
                mesaj_icerik: '📷 Fotoğraf',
                foto: fotoBase64,
                tip: 'foto'
              }
            ]);
            console.log('✅ Fotoğraf Supabase\'e kaydedildi');
          } catch (err) {
            console.error('❌ Fotoğraf hatası:', err);
          }
        }
        
        const mesajlar = db.yukle();
        mesajlar.push({
          id: Date.now().toString(),
          metin: '📷 Fotoğraf',
          foto: fotoBase64,
          tip: 'foto',
          gonderen: BENIM_ID,
          ad: BENIM_ADIM,
          zaman: new Date().toISOString()
        });
        
        db.kaydet(mesajlar);
        mesajlariGoster();
        document.body.removeChild(fileInput);
      };
      
      reader.readAsDataURL(file);
    });
    
    fileInput.click();
  });
}
