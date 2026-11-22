# Proje: Kişisel Portfolyo (github.io)

## Genel
- Statik site (Astro veya düz HTML/CSS). Backend yok.
- Tasarım: minimalist, bento grid, vaka çalışması sayfaları.
- Dil: Türkçe içerik; kod ve yorum satırları İngilizce.

## Tema (dark varsayılan)
- Renkleri sadece CSS değişkenleriyle kullan, hex'i doğrudan yazma.
- Dark: `--bg #0B1220`, `--surface #121B2E`, `--border #1F2A44`,
  `--text #E6EAF2`, `--muted #8A96AD`, `--accent #38BDF8`, `--accent2 #34D399`
- Light: `--bg #F7F8FA`, `--surface #FFFFFF`, `--border #E2E6EE`,
  `--text #0F172A`, `--muted #5B6577`, `--accent #2563EB`, `--accent2 #047857`
- Tek vurgu rengi kuralı: accent sadece tıklanabilir öğelerde.

## Tipografi ve stil
- Inter (metin), JetBrains Mono (teknik etiketler).
- Kart köşe yarıçapı 14px, buton 8px; 8px boşluk ölçeği.

## Kurallar
- Gizli bilgi (API anahtarı, token) asla koda yazılmasın.
- Her görsele alt metin ekle; görseller WebP olsun.
- Mobilde tek sütun; dokunma hedefi en az 44px.
- Bağlantılar göreli (relative) olsun (özel domaine geçiş kolay kalsın).
- Her proje sayfası: Problem, Rolüm, Mimari, Teknolojiler, Sonuç, Bağlantılar.
