// ==================== SUPABASE (GLOBAL) ====================
window.supabaseClient = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase bağlandı');
} else {
  console.warn('⚠️ Supabase CDN yüklenemedi, sadece localStorage çalışacak');
}

// Rastgele kullanıcı ID
const MY_ID = localStorage.getItem('myid') || 'u' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('myid', MY_ID);

// ==================== AYARLAR ====================
const checkbox = document.getElementById("yakala");
const MESAJ_ANAHTARI = 'sohbet_mesajlari';
const KULLANICI_ID = 'ben';
const KULLANICI_ADI = 'Sen';
const KARSIDAKI_ID = 'arda';
const KARSIDAKI_ADI = 'Arda';

// ==================== TEMA ====================
function guncelle() {
  if (checkbox.checked) {
    document.body.style.backgroundImage = "url('oyy.jpeg')";
    document.body.classList.add("dark");
    localStorage.setItem("toggleState", "on");
  } else {
    document.body.style.backgroundImage = "url('olo.jpeg')";
    document.body.classList.remove("dark");
    localStorage.setItem("toggleState", "off");
  }
}

if (localStorage.getItem("toggleState") === "on") checkbox.checked = true;
guncelle();
checkbox.addEventListener("change", guncelle);

// ==================== YAZIYOR ====================
const input = document.querySelector(".input");
const yaziyor = document.getElementById("yaziyor");
let yazmaTimeout;

input.addEventListener("input", () => {
  yaziyor.style.display = "block";
  clearTimeout(yazmaTimeout);
  yazmaTimeout = setTimeout(() => {
    yaziyor.style.display = "none";
  }, 1000);
});

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
  const benimMi = mesaj.gonderen === KULLANICI_ID;
  
  div.className = `mesaj ${benimMi ? 'ben' : 'karsi'}`;
  
  const saat = new Date(mesaj.zaman).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const gosterilenAd = benimMi ? KULLANICI_ADI : (mesaj.ad || KARSIDAKI_ADI);
  
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
  govde.innerHTML = '';
  const mesajlar = db.yukle();
  
  mesajlar.forEach(m => {
    govde.appendChild(mesajOlustur(m));
  });
  
  govde.scrollTop = govde.scrollHeight;
}

// MESAJ GÖNDER
async function mesajGonder() {
  const metin = input.value.trim();
  if (!metin) return;
  
  console.log('Mesaj gönderiliyor:', metin);
  
  if (window.supabaseClient) {
    try {
      await window.supabaseClient.from('Spckedittorsapi').insert([
        {
          kullanici_id: MY_ID,
          mesaj_icerik: metin,
          tip: 'metin'
        }
      ]);
      console.log('✅ Supabase\'e gönderildi');
    } catch (err) {
      console.error('❌ Supabase hatası:', err);
    }
  }
  
  const mesajlar = db.yukle();
  mesajlar.push({
    id: Date.now().toString(),
    metin: metin,
    gonderen: KULLANICI_ID,
    ad: KULLANICI_ADI,
    alici: KARSIDAKI_ID,
    zaman: new Date().toISOString()
  });
  
  db.kaydet(mesajlar);
  mesajlariGoster();
  input.value = '';
}

ucakBtn.addEventListener('click', mesajGonder);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') mesajGonder();
});

// GERÇEK ZAMANLI
if (window.supabaseClient) {
  window.supabaseClient
    .channel('Spckedittorsapi')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Spckedittorsapi' }, payload => {
      console.log('📨 Yeni mesaj geldi:', payload.new);
      const yeni = payload.new;
      
      if (yeni.kullanici_id !== MY_ID) {
        const mesajlar = db.yukle();
        mesajlar.push({
          id: yeni.id,
          metin: yeni.mesaj_icerik,
          gonderen: KARSIDAKI_ID,
          ad: KARSIDAKI_ADI,
          zaman: new Date().toISOString()
        });
        db.kaydet(mesajlar);
        mesajlariGoster();
      }
    })
    .subscribe();
  console.log('✅ Realtime dinleme başladı');
}

mesajlariGoster();
console.log('📂 MY_ID:', MY_ID);

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
            await window.supabaseClient.from('Spckedittorsapi').insert([
              {
                kullanici_id: MY_ID,
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
          gonderen: KULLANICI_ID,
          ad: KULLANICI_ADI,
          alici: KARSIDAKI_ID,
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
