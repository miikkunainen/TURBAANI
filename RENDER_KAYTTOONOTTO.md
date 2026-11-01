# Render-käyttöönotto

Julkaisuasetukset ovat tiedostossa `render.yaml`. Ne eivät vielä luo maksullista palvelua: Render-tilin omistajan pitää kirjautua, yhdistää GitHub ja hyväksyä palvelun luominen erikseen.

## Valmisteltu palvelu

- Repositorio: `miikkunainen/TURBAANI`.
- Toteutushaara: `codex/purjehdus-online` (tai `main`, kun muutosehdotus on yhdistetty).
- Palvelun nimi: `turbaani-purjehdus`.
- Tyyppi: Web Service, Node 24.22.1, Frankfurt.
- Plan ID: `0.5c-512mb` (0,5 CPU, 512 MB).
- Build: `node build.cjs`.
- Start: `node server.cjs`.
- Health check: `/health`.
- Pysyvä levy: 1 GB, `/var/data`.
- Tietokanta: `/var/data/purjehdus.sqlite`.
- Automaattinen uudelleenjulkaisu pois päältä: koodipush ei katkaise peliä kesken session. Uusi versio julkaistaan tietoisesti session ulkopuolella.

Renderin hinnaston tarkistus 1.11.2026: tämän kokoinen palvelin on 7 USD/kk ja levy 0,25 USD/GB/kk. Perusarvio on siis **7,25 USD/kk**, ennen mahdollisia veroja ja käyttöperusteisia lisäkuluja. Tarkista lopullinen hinta Renderin hyväksymisnäkymästä. Älä hyväksy erillistä maksullista workspace-tilausta pelkän tämän palvelun vuoksi, ellei sitä nimenomaisesti haluta. Ilmaiselle web-palvelulle ei voi liittää tämän toteutuksen tarvitsemaa pysyvää levyä.

Lähteet: [Render pricing](https://render.com/pricing), [persistent disks](https://render.com/docs/disks), [Blueprint syntax](https://render.com/docs/blueprint-spec), [Node version](https://render.com/docs/node-version).

## Tee omalla tunnuksellasi

1. Avaa [Render Dashboard](https://dashboard.render.com/) ja luo tili tai kirjaudu. Tee kirjautuminen itse.
2. Valitse **New → Blueprint**. Yhdistä GitHub ja anna Renderille pääsy vain tarvittavaan `TURBAANI`-repositorioon, jos valinta on tarjolla. Hyväksy GitHubin käyttöoikeusikkuna itse.
3. Valitse `miikkunainen/TURBAANI` ja haara `codex/purjehdus-online`. Jos käytät `main`-haaraa, varmista ensin että verkkoversion muutokset ja `render.yaml` ovat siinä.
4. Varmista Blueprint-poluksi `render.yaml`. Tarkista yllä oleva palvelu, Frankfurt, pysyvä levy, hinta ja Node-versio.
5. Hyväksy maksullisen palvelun luominen vain, jos hinta sopii. Syötä tarvittavat laskutustiedot itse. Älä liitä maksukorttitietoja chattiin.
6. Odota tilaa **Live**. Render antaa palvelulle HTTPS-osoitteen. Varsinaista osoitetta ei päätellä palvelun nimestä etukäteen.
7. Avaa annettu osoite ja `/health`. Luo TESTI-peli ja liitä yksi pelaaja toisella laitteella. Kokeile luotsin liittymistä, satamaleimaa, luotsin hyväksyntää ja työn säilymistä sivun päivityksessä.
8. Tee tämän jälkeen erillinen varsinainen Turbiini-peli. Jaa osallistujille sivuosoite sekä pelitunnus; jaa opettajatunnus vain opettajille.

## Huomisen session aikana

Pidä Renderin tila Live. Älä julkaise uutta versiota kesken pelin. Pidä yksi pelinjohtajan välilehti ja sama osallistujalaite koko session ajan. Tallenna lopuksi pelinjohtajan koko pelin varmuuskopio.

Huomioi, että pelitietokanta sisältää työt ja käyttöoikeustiedot. Renderin pysyvä levy on tämän palvelun tallennuspaikka; GitHub on vain lähdekoodi. Levyä tai palvelua ei pidä poistaa ennen töiden talteenottoa.
