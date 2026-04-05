const checkbox = document.getElementById("yakala");

function guncelle() {
  if (checkbox.checked) {
    // SAĞDAYKEN
    document.body.style.backgroundImage = "url('lol.jpeg')";
    localStorage.setItem("toggleState", "on");
  } else {
    // SOLDAYKEN
    document.body.style.backgroundImage = "url('olo.jpeg')";
    localStorage.setItem("toggleState", "off");
  }
}

// Sayfa açılınca
if (localStorage.getItem("toggleState") === "on") {
  checkbox.checked = true;
}

guncelle(); // ilk yükleme

// Tıklanınca
checkbox.addEventListener("change", guncelle);