// ==================== BİLDİRİMLER ====================
// Bildirim izni iste
async function bildirimIzinIste() {
  if (!("Notification" in window)) {
    console.log("Tarayıcı bildirimleri desteklemiyor");
    return;
  }
  
  if (Notification.permission === "granted") {
    console.log("✅ Bildirim izni zaten var");
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("✅ Bildirim izni alındı");
    }
  }
}

// Bildirim göster
function bildirimGoster(baslik, mesaj, kullaniciAdi, kullaniciId) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  
  // Sayfa aktifse bildirim gösterme
  if (document.hasFocus()) return;
  
  const bildirim = new Notification(baslik, {
    body: mesaj,
    icon: "Lolo.JPG",
    tag: kullaniciId,
    renotify: false
  });
  
  // Bildirime tıklayınca mesaj sayfasına git
  bildirim.onclick = () => {
    window.focus();
    localStorage.setItem('mesajlasilan_kullanici', kullaniciAdi);
    localStorage.setItem('mesajlasilan_id', kullaniciId);
    window.location.href = 'index.html';
  };
}

// Sayfa açılınca izin iste
bildirimIzinIste();

// ==================== SUPABASE ====================
window.supabaseClient = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase bağlandı');
}

// ==================== KULLANICI ====================
const BENIM_ADIM = localStorage.getItem('kullanici_adi') || 'Misafir';
const BENIM_ID = localStorage.getItem('kullanici_id') || 'misafir_' + Math.random().toString(36).substr(2, 9);

// ==================== TEMA ====================
const checkbox = document.getElementById("yakala");

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
    yaziyor.style.display = "block";
    clearTimeout(yazmaTimeout);
    yazmaTimeout = setTimeout(() => {
      yaziyor.style.display = "none";
    }, 1000);
  });
}

// ==================== LOCALSTORAGE ====================
const MESAJ_ANAHTARI = 'sohbet_mesajlari';

const db = {
  kaydet: function(mesajlar) {
    localStorage.setItem(MESAJ_ANAHTARI, JSON.stringify(mesajlar));
  },
  yukle: function() {
    const data = localStorage.getItem(MESAJ_ANAHTARI);
    return data ? JSON.parse(data) : [];
  }
};

// ==================== MESAJLAR ====================

const govde = document.querySelector('.govde');
const ucakBtn = document.querySelector('.ucak');

function mesajOlustur(mesaj) {
  const div = document.createElement('div');
  const benimMi = mesaj.kullanici_id === BENIM_ID;
  div.className = `mesaj ${benimMi ? 'ben' : 'karsi'}`;
  
  const saat = new Date(mesaj.gonderim_tarihi || Date.now()).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit'
  });
  
  const gosterilenAd = benimMi ? 'Sen' : (mesaj.kullanici_adi || 'Anonim');
  
  let icerikHTML;
  
  if (mesaj.tip === 'foto' && mesaj.foto) {
    const fotoId = 'foto_' + Date.now() + Math.random();
    icerikHTML = `
      <img src="${mesaj.foto}" style="max-width: 180px; max-height: 180px; border-radius: 10px; cursor: pointer;" 
           onclick="document.getElementById('${fotoId}').style.display='flex'">
      <div id="${fotoId}" class="modal" style="display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); cursor: pointer;" 
           onclick="this.style.display='none'">
        <img src="${mesaj.foto}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90%; max-height: 90%; border-radius: 5px;">
      </div>
    `;
  } 
  else if (mesaj.tip === 'dosya' && mesaj.dosya_url) {
    const dosyaAdi = mesaj.dosya_adi || 'Dosya';
    const dosyaTipi = mesaj.dosya_tip || '';
    
    let dosyaIcon = '📄';
    if (dosyaTipi.includes('pdf')) dosyaIcon = '📑';
    else if (dosyaTipi.includes('image')) dosyaIcon = '🖼️';
    else if (dosyaTipi.includes('word')) dosyaIcon = '📝';
    else if (dosyaTipi.includes('excel')) dosyaIcon = '📊';
    else if (dosyaTipi.includes('html')) dosyaIcon = '🌐';
    
    // Basılı tutma için değişkenler
    let basiliTutmaTimeout = null;
    let basiliTutmaAktif = false;
    
    icerikHTML = `
      <div id="dosya_${mesaj.id}" style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 10px; cursor: pointer; user-select: none; -webkit-user-select: none;">
        <span style="font-size: 30px; pointer-events: none;">${dosyaIcon}</span>
        <div style="pointer-events: none;">
          <div style="font-weight: bold;">${dosyaAdi}</div>
          <div style="font-size: 10px; opacity: 0.7;">Tek tıkla aç | Basılı tut indir</div>
        </div>
      </div>
    `;
    
    // Olayları sonradan ekle
    setTimeout(() => {
      const dosyaDiv = document.getElementById(`dosya_${mesaj.id}`);
      if (dosyaDiv) {
        
        // Tek tıkla aç
        dosyaDiv.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (basiliTutmaAktif) return;
          window.open(mesaj.dosya_url, '_blank');
        };
        
        // Basılı tut (indir)
        dosyaDiv.onmousedown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          basiliTutmaAktif = false;
          
          basiliTutmaTimeout = setTimeout(() => {
            basiliTutmaAktif = true;
            
            // İndir
            const link = document.createElement('a');
            link.href = mesaj.dosya_url;
            link.download = dosyaAdi;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Bildirim
            const bildirim = document.createElement('div');
            bildirim.textContent = `✅ "${dosyaAdi}" indiriliyor...`;
            bildirim.style.cssText = `
              position: fixed;
              bottom: 100px;
              left: 50%;
              transform: translateX(-50%);
              background: #4CAF50;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-family: monospace;
              z-index: 10000;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              animation: fadeInOut 2s ease;
            `;
            document.body.appendChild(bildirim);
            setTimeout(() => bildirim.remove(), 2000);
            
            dosyaDiv.style.transform = 'scale(0.97)';
            setTimeout(() => dosyaDiv.style.transform = '', 200);
          }, 500);
        };
        
        // Bırakınca temizle
        dosyaDiv.onmouseup = (e) => {
          e.preventDefault();
          e.stopPropagation();
          clearTimeout(basiliTutmaTimeout);
          setTimeout(() => { basiliTutmaAktif = false; }, 100);
        };
        
        // Fare dışarı çıkarsa temizle
        dosyaDiv.onmouseleave = (e) => {
          clearTimeout(basiliTutmaTimeout);
          setTimeout(() => { basiliTutmaAktif = false; }, 100);
        };
        
        // Sürükleme engelle
        dosyaDiv.ondragstart = (e) => {
          e.preventDefault();
          return false;
        };
      }
    }, 10);
  }
  else {
    icerikHTML = `<div class="mesaj-icerik">${mesaj.mesaj_icerik}</div>`;
  }
  
  div.innerHTML = `
    <div class="mesaj-baslik">${gosterilenAd}</div>
    ${icerikHTML}
    <div class="mesaj-saat">${saat}</div>
  `;
  return div;
}

// MESAJLARI YÜKLE (Supabase'den çek)
async function mesajlariYukle() {
  if (!window.supabaseClient) return;
  
  try {
    const { data, error } = await window.supabaseClient
      .from('spckedittorsapi')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const mesajlar = data.reverse();
      db.kaydet(mesajlar);
      
      govde.innerHTML = '';
      mesajlar.forEach(m => govde.appendChild(mesajOlustur(m)));
      govde.scrollTop = govde.scrollHeight;
      console.log('✅ Mesajlar yüklendi');
    } else {
      govde.innerHTML = '';
    }
  } catch (err) {
    console.error('❌ Hata:', err);
    const localMesajlar = db.yukle();
    if (localMesajlar.length > 0) {
      govde.innerHTML = '';
      localMesajlar.slice(-10).forEach(m => govde.appendChild(mesajOlustur(m)));
    }
  }
}



// MESAJ GÖNDER
async function mesajGonder() {
  if (!input) return;
  const metin = input.value.trim();
  if (!metin) return;
  
  const geciciMesaj = {
    id: Date.now(),
    kullanici_id: BENIM_ID,
    kullanici_adi: BENIM_ADIM,
    mesaj_icerik: metin,
    tip: 'metin',
    gonderim_tarihi: new Date().toISOString()
  };
  
  govde.appendChild(mesajOlustur(geciciMesaj));
  govde.scrollTop = govde.scrollHeight;
  input.value = '';
  
  while (govde.children.length > 10) {
    govde.removeChild(govde.firstChild);
  }
  
  try {
    await window.supabaseClient.from('spckedittorsapi').insert([{
      kullanici_id: BENIM_ID,
      kullanici_adi: BENIM_ADIM,
      mesaj_icerik: metin,
      tip: 'metin'
    }]);
  } catch (err) {
    console.error('❌ Kayıt hatası:', err);
  }
}

// FOTOĞRAF GÖNDER
async function fotoGonder(fotoBase64) {
  const geciciMesaj = {
    id: Date.now(),
    kullanici_id: BENIM_ID,
    kullanici_adi: BENIM_ADIM,
    mesaj_icerik: '📷 Fotoğraf',
    foto: fotoBase64,
    tip: 'foto',
    gonderim_tarihi: new Date().toISOString()
  };
  
  govde.appendChild(mesajOlustur(geciciMesaj));
  govde.scrollTop = govde.scrollHeight;
  
  while (govde.children.length > 10) {
    govde.removeChild(govde.firstChild);
  }
  
  try {
    await window.supabaseClient.from('spckedittorsapi').insert([{
      kullanici_id: BENIM_ID,
      kullanici_adi: BENIM_ADIM,
      mesaj_icerik: '📷 Fotoğraf',
      foto: fotoBase64,
      tip: 'foto'
    }]);
  } catch (err) {
    console.error('❌ Kayıt hatası:', err);
  }
}

// DOSYA GÖNDER
let geciciFile = null;
async function dosyaGonder(dosyaBase64, dosyaAdi, dosyaTipi) {
  const dosyaBoyutu = (geciciFile.size / 1024).toFixed(2) + ' KB';
  
  const geciciMesaj = {
    id: Date.now(),
    kullanici_id: BENIM_ID,
    kullanici_adi: BENIM_ADIM,
    mesaj_icerik: `📄 ${dosyaAdi} (${dosyaBoyutu})`,
    dosya_url: dosyaBase64,
    dosya_adi: dosyaAdi,
    dosya_tip: dosyaTipi,
    tip: 'dosya',
    gonderim_tarihi: new Date().toISOString()
  };
  
  govde.appendChild(mesajOlustur(geciciMesaj));
  govde.scrollTop = govde.scrollHeight;
  
  while (govde.children.length > 10) {
    govde.removeChild(govde.firstChild);
  }
  
  try {
    await window.supabaseClient.from('spckedittorsapi').insert([{
      kullanici_id: BENIM_ID,
      kullanici_adi: BENIM_ADIM,
      mesaj_icerik: `📄 ${dosyaAdi} (${dosyaBoyutu})`,
      dosya_url: dosyaBase64,
      dosya_adi: dosyaAdi,
      dosya_tip: dosyaTipi,
      tip: 'dosya'
    }]);
    console.log('✅ Dosya gönderildi:', dosyaAdi);
  } catch (err) {
    console.error('❌ Dosya hatası:', err);
  }
}

// ==================== BUTONLAR ====================

// FOTOĞRAFLAR (direkt galeri - alternatif)
const galeriBtn = document.getElementById('galeriBtn');
if (galeriBtn) {
  galeriBtn.addEventListener('click', () => {
    // HTML input oluştur
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        await fotoGonder(event.target.result);
      };
      reader.readAsDataURL(file);
      document.body.removeChild(input);
    };
    
    input.click();
  });
}

// KAMERA
const kameraBtn = document.querySelector('.daire-im');
if (kameraBtn) {
  kameraBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        await fotoGonder(event.target.result);
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  });
}

// BELGE (dosya)
const belgeBtn = document.querySelector('.daire-fil');
if (belgeBtn) {
  belgeBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '*/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      geciciFile = file;
      const reader = new FileReader();
      reader.onload = async (event) => {
        await dosyaGonder(event.target.result, file.name, file.type);
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  });
}

// INPUT YANINDAKİ KAMERA ICONU
const iconBtn = document.querySelector('.kamera');
if (iconBtn) {
  iconBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        await fotoGonder(event.target.result);
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  });
}

// ==================== REALTIME ====================
if (window.supabaseClient) {
  window.supabaseClient.channel('spckedittorsapi')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'spckedittorsapi' }, payload => {
      const yeni = payload.new;
      if (yeni.kullanici_id === BENIM_ID) return;
      
      // Mesaj tipine göre içerik
      let mesajIcerik = yeni.mesaj_icerik;
      if (yeni.tip === 'foto') mesajIcerik = '📷 Fotoğraf gönderdi';
      if (yeni.tip === 'dosya') mesajIcerik = '📄 Dosya gönderdi';
      
      // Ekrana ekle
      govde.appendChild(mesajOlustur(yeni));
      govde.scrollTop = govde.scrollHeight;
      
      while (govde.children.length > 10) {
        govde.removeChild(govde.firstChild);
      }
      
      // LocalStorage'ı güncelle
      const mesajlar = db.yukle();
      mesajlar.push(yeni);
      while (mesajlar.length > 50) mesajlar.shift();
      db.kaydet(mesajlar);
      
      // BİLDİRİM GÖSTER
      const gosterilenAd = yeni.kullanici_adi || 'Bir kullanıcı';
      bildirimGoster(gosterilenAd, mesajIcerik, gosterilenAd, yeni.kullanici_id);
    })
    .subscribe();
}

// ==================== BAŞLAT ====================
if (ucakBtn) ucakBtn.addEventListener('click', mesajGonder);
if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') mesajGonder(); });

// Mesajları yükle
mesajlariYukle();

// Üstteki isim
const isimAlani = document.getElementById('karsiAd');
if (isimAlani) isimAlani.textContent = BENIM_ADIM;

// ==================== ÇIKIŞ YAP MODAL ====================
function cikisModalGoster() {
  const eskiModal = document.getElementById('cikisModal');
  if (eskiModal) eskiModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'cikisModal';
  modal.className = 'modal-cikis';
  modal.innerHTML = `
        <div class="modal-cikis-content">
            <h3>ÇIKIS YAP</h3>
            <p>Çikis yapmak istediğinize emin misiniz?</p>
            <div class="modal-buttons">
                <button class="modal-btn cikis" id="cikisYapBtn">Çikis Yap</button>
                <button class="modal-btn hesap-degis" id="hesapDegisBtn">Hesap Degistir</button>
            </div>
        </div>
    `;
  
  document.body.appendChild(modal);
  modal.style.display = 'block';
  
  document.getElementById('cikisYapBtn').onclick = () => {
    localStorage.removeItem('kullanici_adi');
    localStorage.removeItem('kullanici_id');
    localStorage.removeItem('remember');
    localStorage.removeItem('toggleState');
    window.location.href = 'g1.html';
  };
  
  document.getElementById('hesapDegisBtn').onclick = () => {
    window.location.href = 'g1.html';
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

const cikisYapLink = document.querySelector('.kirmizi-yazi');
if (cikisYapLink) {
  cikisYapLink.addEventListener('click', (e) => {
    e.preventDefault();
    cikisModalGoster();
  });
}

// ==================== PROFİL FOTOĞRAFI GÖSTER ====================
async function profilFotoGoster() {
  if (!BENIM_ID) return;
  
  // Önce localStorage'dan dene
  const kayitliFoto = localStorage.getItem('profil_foto');
  if (kayitliFoto && kayitliFoto !== 'null' && kayitliFoto !== 'undefined' && kayitliFoto !== '') {
    const profilImg = document.querySelector('.profile-img');
    if (profilImg) {
      profilImg.src = kayitliFoto;
      console.log('✅ Profil fotoğrafı localStorage\'dan yüklendi');
    }
  }
  
  // Sonra Supabase'den al ve güncelle
  try {
    const { data, error } = await window.supabaseClient
      .from('kullanicilar')
      .select('profil_foto')
      .eq('id', BENIM_ID)
      .maybeSingle();
    
    if (error) {
      console.error('Supabase sorgu hatası:', error);
      return;
    }
    
    if (data && data.profil_foto && data.profil_foto !== kayitliFoto) {
      const profilImg = document.querySelector('.profile-img');
      if (profilImg) {
        profilImg.src = data.profil_foto;
        console.log('✅ Profil fotoğrafı Supabase\'den yüklendi');
      }
      localStorage.setItem('profil_foto', data.profil_foto);
    }
  } catch (err) {
    console.error('Fotoğraf yükleme hatası (önemsiz):', err.message);
    // Bu hata genelde CORS veya ağ sorunu, önemli değil
  }
}

// Sayfa açılınca profil fotoğrafını göster
setTimeout(() => {
  try {
    profilFotoGoster();
  } catch (e) {
    console.log('Profil fotoğrafı yüklenemedi, ama sorun değil');
  }
}, 100);

// Sayfa açılınca profil fotoğrafını göster
setTimeout(() => {
  profilFotoGoster();
}, 100);

// Arka planda profil fotoğrafı senkronizasyonu
async function profilFotoSenkronize() {
  if (!BENIM_ID) return;
  
  try {
    const { data, error } = await window.supabaseClient
      .from('kullanicilar')
      .select('profil_foto, kullanici_adi')
      .eq('id', BENIM_ID)
      .maybeSingle();
    
    if (error) throw error;
    
    const kayitliFoto = localStorage.getItem('profil_foto');
    const kayitliIsim = localStorage.getItem('kullanici_adi');
    
    if (data && data.profil_foto && data.profil_foto !== kayitliFoto) {
      localStorage.setItem('profil_foto', data.profil_foto);
      const profilImg = document.querySelector('.profile-img');
      if (profilImg) profilImg.src = data.profil_foto;
    }
    
    if (data && data.kullanici_adi && data.kullanici_adi !== kayitliIsim) {
      localStorage.setItem('kullanici_adi', data.kullanici_adi);
      const isimAlani = document.getElementById('karsiAd');
      if (isimAlani) isimAlani.textContent = data.kullanici_adi;
    }
  } catch (err) {
    console.error('Senkronizasyon hatası:', err);
  }
}

// Sayfa açılınca arka planda senkronizasyon yap
setTimeout(() => {
  profilFotoSenkronize();
}, 500);