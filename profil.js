// Supabase bağlantısı
const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Kullanıcı bilgileri
let kullaniciAdi = localStorage.getItem('kullanici_adi');
let kullaniciId = localStorage.getItem('kullanici_id');

// DOM elementleri
const profilIsim = document.getElementById('profilIsim');
const profilResim = document.getElementById('profilResim');
const profilKameraBtn = document.getElementById('profilKameraBtn');
const isimDuzenleBtn = document.getElementById('isimDuzenleBtn');
const cikisBtn = document.getElementById('cikisBtn');

// Tema kontrolü
if (localStorage.getItem('toggleState') === 'on') {
  document.body.classList.add('dark');
}

// Kullanıcı adını hemen göster
if (kullaniciAdi && kullaniciAdi !== 'Misafir') {
  profilIsim.textContent = kullaniciAdi;
} else {
  profilIsim.textContent = 'Kullanıcı';
}

// Profil fotoğrafını localStorage'dan hemen göster (anında)
const kayitliFoto = localStorage.getItem('profil_foto');
if (kayitliFoto && kayitliFoto !== 'null' && kayitliFoto !== 'undefined') {
  profilResim.src = kayitliFoto;
}

// Arka planda Supabase'den kontrol et (sadece fark varsa güncelle)
async function supabaseFotoKontrol() {
  if (!kullaniciId) return;
  
  try {
    const { data, error } = await supabaseClient
      .from('kullanicilar')
      .select('profil_foto, kullanici_adi')
      .eq('id', kullaniciId)
      .maybeSingle();
    
    if (error) throw error;
    
    let guncellemeVar = false;
    
    // Profil fotoğrafı kontrolü
    if (data && data.profil_foto && data.profil_foto !== kayitliFoto) {
      localStorage.setItem('profil_foto', data.profil_foto);
      profilResim.src = data.profil_foto;
      guncellemeVar = true;
    }
    
    // İsim kontrolü (başka cihazda değişmişse)
    if (data && data.kullanici_adi && data.kullanici_adi !== kullaniciAdi) {
      localStorage.setItem('kullanici_adi', data.kullanici_adi);
      kullaniciAdi = data.kullanici_adi;
      profilIsim.textContent = data.kullanici_adi;
      guncellemeVar = true;
    }
    
    if (guncellemeVar) {
      console.log('✅ Profil bilgileri senkronize edildi');
    }
  } catch (err) {
    console.error('Senkronizasyon hatası:', err);
  }
}

// Profil fotoğrafını kaydet (Supabase + LocalStorage)
async function profilResmiKaydet(fotoBase64) {
  if (!kullaniciId) return;
  
  // 1. Hemen LocalStorage'a kaydet ve göster (anında)
  localStorage.setItem('profil_foto', fotoBase64);
  profilResim.src = fotoBase64;
  
  // Ana sayfadaki fotoğrafı da güncelle
  const anaSayfaResim = document.querySelector('.profile-img');
  if (anaSayfaResim) {
    anaSayfaResim.src = fotoBase64;
  }
  
  // 2. Arka planda Supabase'e kaydet
  try {
    await supabaseClient
      .from('kullanicilar')
      .upsert({
        id: kullaniciId,
        kullanici_adi: kullaniciAdi,
        profil_foto: fotoBase64
      });
    console.log('✅ Supabase\'e kaydedildi');
  } catch (err) {
    console.error('Supabase hatası:', err);
  }
}

// Galeriden fotoğraf seç
function fotoSec() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      profilResmiKaydet(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  fileInput.click();
}

// Kamera ile fotoğraf çek
function kameraAc() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.capture = 'environment';
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      profilResmiKaydet(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  fileInput.click();
}

// Kamera butonu
if (profilKameraBtn) {
  profilKameraBtn.addEventListener('click', () => {
    const secim = confirm('Fotoğraf seçmek için "Tamam", kamera ile çekmek için "İptal"e basın.');
    if (secim) {
      fotoSec();
    } else {
      kameraAc();
    }
  });
}

// İsim düzenleme (kalem butonu)
if (isimDuzenleBtn) {
  isimDuzenleBtn.addEventListener('click', async () => {
    const yeniIsim = prompt('Yeni kullanıcı adınızı girin:', kullaniciAdi);
    if (yeniIsim && yeniIsim.trim() && yeniIsim.trim() !== kullaniciAdi) {
      const yeniIsimTrim = yeniIsim.trim();
      
      try {
        // 1. Supabase Auth metadata güncelle
        const { error } = await supabaseClient.auth.updateUser({
          data: { kullanici_adi: yeniIsimTrim }
        });
        
        if (error) throw error;
        
        // 2. LocalStorage'ı güncelle
        localStorage.setItem('kullanici_adi', yeniIsimTrim);
        kullaniciAdi = yeniIsimTrim;
        
        // 3. Profil sayfasındaki ismi güncelle
        profilIsim.textContent = yeniIsimTrim;
        
        // 4. Kullanicilar tablosunu güncelle
        await supabaseClient
          .from('kullanicilar')
          .upsert({
            id: kullaniciId,
            kullanici_adi: yeniIsimTrim
          });
        
        // 5. Ana sayfadaki ismi güncelle
        const anaSayfaIsim = document.getElementById('karsiAd');
        if (anaSayfaIsim) {
          anaSayfaIsim.textContent = yeniIsimTrim;
        }
        
        alert('İsim başarıyla güncellendi!');
        
      } catch (error) {
        alert('Hata: ' + error.message);
      }
    }
  });
}

// Çıkış yap
if (cikisBtn) {
  cikisBtn.addEventListener('click', () => {
    localStorage.removeItem('kullanici_adi');
    localStorage.removeItem('kullanici_id');
    localStorage.removeItem('remember');
    localStorage.removeItem('profil_foto');
    localStorage.removeItem('toggleState');
    window.location.href = 'g1.html';
  });
}

// Geri butonu
const geriBtn = document.querySelector('.geri-butonu');
if (geriBtn) {
  geriBtn.onclick = () => {
    window.location.href = 'index.html';
  };
}

// Sayfa açılınca arka planda senkronizasyon yap (sayfa yavaşlamasın)
setTimeout(() => {
  supabaseFotoKontrol();
}, 500);