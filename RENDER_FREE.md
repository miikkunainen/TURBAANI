# Maksuton käyttöönotto: Render Free + Supabase Free

Tämä on valittu julkaisutapa. **Maksullista Render-palvelua tai levyä ei oteta käyttöön.**

- GitHub: `miikkunainen/TURBAANI`, haara `codex/purjehdus-online`.
- Render Free: pelisivu ja Node-palvelin, Frankfurt, ei pysyvää levyä.
- Supabase Free: huoneet, työt ja vastaanottamista odottavat leimat.
- `render.yaml` käyttää `plan: free` ja vaatii Supabase-asetukset. Palvelin ei käynnisty vahingossa tilapäisellä SQLite-levyllä, jos asetukset puuttuvat.

## 1. Luo Supabase Free -projekti

1. Avaa [Supabase Dashboard](https://supabase.com/dashboard) ja kirjaudu tai luo tili itse.
2. Luo uusi projekti **Free-organisaatioon**. Valitse EU-alue, esimerkiksi Frankfurt, jos se on tarjolla. Aseta projektin tietokantasalasana itse ja säilytä se omassa salasananhallinnassasi.
3. Kun projekti on valmis, avaa **SQL Editor**. Kopioi tämän repositorion `supabase-schema.sql` editoriin ja suorita se.
4. Käytä uusinta supabase-schema.sql-tiedostoa myös, jos ajoit aiemman version: uusi versio lisää säilytysajan ja poisto-oikeuden. SQL luo yhden `purjehdus_rooms`-taulun ja rajaa sen pääsyn palvelimelle. Älä lisää julkista read/write-politiikkaa.
5. Kopioi projektin **Project URL** ja palvelinkäyttöön tarkoitettu **secret API key** (`sb_secret_…`) Supabasen Connect-/API Keys -näkymästä. Ne siirretään seuraavassa vaiheessa suoraan Renderin ympäristömuuttujiin. **Älä lähetä avainta chattiin tai commitoi sitä GitHubiin.** Publishable-avain ei riitä tämän taulun käyttöön.

## 2. Luo Render Free -palvelu

1. Avaa [Render Dashboard](https://dashboard.render.com/) ja kirjaudu tai luo tili itse.
2. Valitse **New → Blueprint** ja yhdistä GitHub. Anna Renderille pääsy `TURBAANI`-repositorioon. Hyväksy GitHubin käyttöoikeusikkuna itse.
3. Valitse haara `codex/purjehdus-online` ja Blueprint-tiedostoksi `render.yaml`. Jos käytät `main`-haaraa, varmista ensin että muutosehdotus on yhdistetty siihen.
4. Blueprint pyytää kaksi arvoa:

| Muuttuja | Arvo |
|---|---|
| `SUPABASE_URL` | Supabase-projektin Project URL |
| `SUPABASE_SECRET_KEY` | Secret API key `sb_secret_…`, vain palvelimelle |

5. Tarkista ennen luomista: **Free**, ei maksullista levyä, ei Pro-workspacea. Jos käyttöliittymä ehdottaa maksullista tilausta, älä hyväksy sitä tätä toteutusta varten. Maksutavattomalla tilillä kiintiöylitys johtaa palvelun rajoittamiseen lisäveloituksen sijasta Renderin ehtojen mukaisesti.
6. Asetukset ovat valmiina: Node 24.22.1, build `node build.cjs`, start `node server.cjs`, health `/health`. `REQUIRE_REMOTE_STORAGE=1` estää tilapäisen paikallislevyn käytön pelitallennukseen.
7. Käynnistä julkaisu. Odota tilaa **Live**. Käytä Renderin palauttamaa HTTPS-osoitetta; sitä ei ole vielä vahvistettu eikä arvata palvelun nimestä.

Automaattiset uudelleenjulkaisut on poistettu käytöstä. GitHub-push ei näin aloita uutta julkaisua kesken pelisession.

## 3. Ennen huomista luokkaa

1. Tarkista Supabasen projektin olevan aktiivinen.
2. Avaa Renderin peliosoite **5–10 minuuttia ennen** osallistujia ja odota liittymissivun latautumista. Älä odota palvelun heräämistä vasta yhteisen peliajan alussa.
3. Luo TESTI-peli. Liitä pelaaja ja luotsi eri laitteilla. Kokeile satamaleimaa, luotsin hyväksyntää ja pelaajan kirjauksen säilymistä sivun päivityksessä.
4. Varmista Supabasen Table Editorissa, että `purjehdus_rooms` sisältää testihuoneen. Älä jaa taulun sisältöä: siinä on myös käyttöoikeustietoja.
5. Tee erillinen varsinainen Turbiini-peli. Jaa sivuosoite ja pelitunnus opiskelijoille sekä erillinen opettajatunnus vain opettajille.
6. Pidä tavallinen pelinjohtajan näkymä auki. Älä julkaise uutta versiota kesken pelin. Tallenna lopuksi koko pelin varmuuskopio.

## Maksuttomien tasojen rajat

Tarkistettu 1.11.2026:

- Render Free menee lepotilaan 15 minuutin liikenteettömyyden jälkeen ja herää uuden pyynnön seurauksena; herääminen kestää tyypillisesti noin minuutin. Palvelu käyttää maksuttoman tason kuukausikiintiöitä. Render ei suosittele Free-palvelua tuotantokriittisiin sovelluksiin.
- Supabase Free sisältää 500 MB tietokantaa ja 5 GB ulosmenevää liikennettä. Projekti voidaan keskeyttää viikon käyttämättömyyden jälkeen. Käyttörajat eivät ole lupaus keskeytyksettömästä saatavuudesta.
- Tämä versio käyttää yhtä Render-palvelininstanssia. Sen huonevälimuisti vähentää tietokantakyselyitä; tavallinen kahden sekunnin tilakysely ei kirjoita koko huonetta tietokantaan. Vain varsinaiset muutokset tallennetaan.
- Pidä varakello ja paperipolku mukana ensimmäisessä oikeassa luokkakokeilussa. Peliä ei ole kuormatestattu 15 laitteella 70 minuutin ajan.

Lähteet: [Render Free](https://render.com/docs/free), [Supabase Free](https://supabase.com/pricing), [Supabasen avaimet](https://supabase.com/docs/guides/getting-started/api-keys).

## Tarkistusten tila

43 ohjelmallista tarkistusta läpäisty. Mukana ovat asynkroninen tallennus, yhtäaikaiset liittymiset, välimuisti, tietokantavirheen käsittely ja sen esto, ettei ilmaisjulkaisu vahingossa käytä katoavaa levyä. Supabase-REST-kerros on testattu jäljitellyillä REST-vastauksilla; yhteyttä sinun oikeaan Supabase-projektiisi ei ole vielä testattu, koska projektia ja sen asetuksia ei ole annettu. Julkinen Render-julkaisu vahvistetaan vasta tilan luomisen ja Live-osoitteen tarkistuksen jälkeen.
