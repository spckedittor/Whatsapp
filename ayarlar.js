// Supabase bağlantısı
const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Kullanıcı bilgileri
const kullaniciAdi = localStorage.getItem('kullanici_adi');
const kullaniciId = localStorage.getItem('kullanici_id');
const profilFoto = localStorage.getItem('profil_foto');

// DOM elementleri
const isimElement = document.getElementById('kullaniciAdi');
const profilResim = document.querySelector('.profile-img');
const cikisBtn = document.getElementById('cikisBtn');

// Tema kontrolü
if (localStorage.getItem('toggleState') === 'on') {
  document.body.classList.add('dark');
}

// Kullanıcı adını göster
if (kullaniciAdi && kullaniciAdi !== 'Misafir') {
  isimElement.textContent = kullaniciAdi;
} else {
  isimElement.textContent = 'Kullanıcı';
}

// Profil fotoğrafını göster
if (profilFoto && profilFoto !== 'null') {
  profilResim.src = profilFoto;
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

// Dark mod için tema takibi (ana sayfadaki değişiklikler için)
window.addEventListener('storage', () => {
  if (localStorage.getItem('toggleState') === 'on') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
});