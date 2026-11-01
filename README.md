# Purjehdus verkossa — Turbiini

Purjehdus 3:n 70 minuutin Double Diamond -peli, jossa QR-siirrot on korvattu palvelinyhteydellä. Tehtävät, seitsemän satamaa, muona, luotsin leimat, liittoutuminen, pisteytys ja kriisit perustuvat toimitettuun Purjehdus 3 -versioon.

## Tila 1.11.2026

Paikallisesti toteutettu ja testattu. 23 automaattista HTTP-/palvelintestiä läpäisty. Pelin pääpolku kokeiltu oikeassa selaimessa erillisillä pelinjohtajan, pelaajan ja luotsin välilehdillä: liittyminen, lähtökirjaukset, aloituksen päivitys, satamaleima, löydöt, Define, luotsin hyväksyntä, kolme ideaa, pisteytys, myrsky, rantautuminen ja tallennetun työn palautuminen sivun uudelleenlatauksessa.

**Julkista palvelinta ei ole tämän toimituksen yhteydessä otettu käyttöön.** GitHub-repositorio on lähdekoodin ja CI-testien paikka. GitHub Pages ei suorita tätä Node-palvelinta. Julkinen peli tarvitsee yhden Node 24- tai Docker-palvelun, HTTPS:n ja pysyvän levytilan. Käyttöliittymä ja API palvellaan samasta osoitteesta; Supabasea tai muuta erillistä tietokantatiliä ei tarvita.

## Käynnistä

Node.js 24 tai uudempi, ei asennettavia npm-riippuvuuksia:

```sh
node build.cjs
node --test test/*.test.cjs
node server.cjs
```

Avaa `http://localhost:8080`. Käytä Node 24:ää, koska palvelin käyttää sen sisäänrakennettua SQLite-tietokantaa.

Dockerilla:

```sh
docker compose up --build -d
```

Compose luo pysyvän `purjehdus-data`-volyymin. Pelitietokanta ei ole lähdekoodia eikä sitä pidä commitoida GitHubiin.

## Julkaisu GitHubista

1. Valitse palvelinpaikka, joka suorittaa Node 24:ää tai mukana olevan Dockerfilen.
2. Liitä tämä GitHub-repositorio ja käyttöön otettava haara palveluun.
3. Käynnistyskomento: `node server.cjs`. Rakennuskomento tarvittaessa: `node build.cjs`.
4. Määritä `PORT` palvelun vaatimalla tavalla (oletus 8080), `HOST` tarvittaessa (oletus 0.0.0.0) ja `DATA_FILE` pysyvän levyn tiedostopoluksi, esimerkiksi `/app/data/purjehdus.sqlite`.
5. Liitä pysyvä levy samaan polkuun. Tilapäisellä levyllä tietokanta voi kadota uudelleenjulkaisussa, vaikka tavallinen sovellusprosessin uudelleenkäynnistys toimii.
6. Ota käyttöön palvelun HTTPS-osoite. Julkisessa HTTP-osoitteessa selaimen salausrajapinta ei välttämättä toimi; localhost on kehityspoikkeus.
7. Käytä **yhtä palvelininstanssia** ja sen yhtä pysyvää SQLite-levyä. Tämä toimitus ei ole monen palvelininstanssin klusteri.
8. Tarkista `/health` sekä liittyminen, luotsin leima ja uudelleenavaus kahdella oikealla osallistujalaitteella ennen luokkaa.

## Pelinjohtajan pikaohje

1. Avaa yhteinen osoite ja täytä oikean puolen **Pelinjohtajan lähtösatama**. **Luo uusi peli**.
2. Näytä opiskelijoille sivuosoite ja **pelitunnus**. Opiskelijat avaavat sivun, kirjoittavat nimimerkin tai venekunnan nimen, valitsevat pelaajaroolin ja liittyvät. Jokaisella venekunnalla on oma lokikirja; venekunnan yhteistä tekstiä kirjoitetaan yhdeltä laitteelta.
3. Avaa **Opettajien liittymistunnus** ja näytä se vain opettajille projektorin kuva pimennettynä. Opettajat liittyvät samalla pelitunnuksella ja erillisellä opettajatunnuksella luotsiksi tai satamaksi.
4. Kun osallistujat näkyvät, paina **Aloita peli**. Aloitus ja myöhemmät muutokset päivittyvät laitteille noin kahden sekunnin välein, kun yhteys on toimiva. Kukaan ei kuvaa koodia.
5. Klikkaa veneen nimeä avataksesi tuoreen lastin. Opettaja antaa **Sataman leiman** tai **Luotsi: kapeikko auki**. Pelaaja saa sen automaattisesti. Tarkastelukortti ei piirtyile uudelleen kesken opettajan kirjoittamisen; **Päivitä lasti** hakee uuden tilanteen tarvittaessa.
6. Pelaaja valitsee liittolaisen nimilistasta. Palvelin toimittaa löydöt, ideat ja liittosidoksen molemmille. Kriisivastaukset lähetetään painikkeella suoraan vastaanottajalle.
7. Seuraa yläpalkin verkkotilaa. Jos siinä lukee tallentamatta tai yhteys katkesi, viimeisin luonnos säilyy samalla selaimella ja lähetys yrittää uudelleen. Älä sulje selainta ennen vihreää/normaalia tallennuskuittausta, jos palvelinyhteys on poikki.
8. Lopuksi jokainen kirjoittaa opin ja seuraavan asiakaskokeen sekä laskee ankkurin. Johtaja lataa **koko pelin varmuuskopion**, joka sisältää kaikkien veneiden palvelimelle tallennetut työt. Säilytä se ohjaajilla: se sisältää myös opettajatunnuksen ja leimojen allekirjoitusavaimen.

Pelin kesto ja sisältöportit säilyvät alkuperäisinä: 5 / 15 / 12 / 5 / 15 / 10 / 8 minuuttia. Pääkello ei pysähdy kriisien ajaksi. +5 min lisää kokonaiskestoa. Kellon vaiheenvaihto ei ohita keskeneräisiä kirjauksia tai luotsin porttia. Deliver on arviointimatriisi ja painotusten herkkyystarkistus; se ei itsessään osoita todellista asiakaskysyntää.

## Tallennus, roolit ja yhteys

- Palvelin tallentaa huoneet, pelaajien työt ja vastaanottamista odottavat leimat SQLiteen. Katkon jälkeen leima poistuu jonosta vasta vastaanottokuittauksella, ja nonce estää saman leiman soveltamisen kahdesti.
- Pelinjohtaja voi muuttaa yhteistä peliä. Opettaja voi tarkastella lasteja ja antaa leimoja. Pelaaja saa oman työtilansa sekä muiden veneiden nimet, mutta ei toisten kokonaisia töitä tai opettaja-avainta. Tietoja jaetaan pelaajien kesken vain liittoutumistoiminnolla.
- Enintään 15 pelaajaistuntoa ja neljä opettajaistuntoa, yksi pelinjohtaja. Nimimerkin uudelleen syöttäminen luo uuden veneen. Jatkamiseen käytetään saman selaimen **Jatka aiempaa peliä** -linkkiä tai jo avointa pelivälilehteä.
- Tämä toteutus ei sisällä yksittäisen pelaajan istunnon vapautusta, käyttäjätilien salasanapalautusta tai koko pelin JSON-varmuuskopion tuontia uuteen palvelimeen. Palvelinlevyn normaali varmistaminen ja palauttaminen on ylläpitäjän tehtävä. Paikallisen QR-pelitilan tuonti on verkkoversiossa poistettu, jotta se ei ylikirjoita yhteistä huonetta.
- Oppimispelin omia kirjauksia ja muonamäärää käsitellään pelaajan syöttämänä työnä; tämä ei ole tentin huijauksenestojärjestelmä. Luotsin hyväksyntä ja yhteisen pelin hallinta kuitenkin tarkistetaan palvelimella.
- Tähän GitHub-repoon ei sisälly oikeita pelitietoja, istuntotunnisteita, avaimia tai opiskelijakirjauksia. `data/` ja SQLite-tiedostot on jätetty versionhallinnan ulkopuolelle.

## Tiedostot

- `server.cjs`: HTTP-API, käyttöoikeudet, leimajonot ja SQLite.
- `public/game.html`: toimitettu Purjehdus 3, johon build lisää verkkosovittimen.
- `public/net.js`: alkuperäisen pelin ja verkkopalvelimen yhdistävä kerros.
- `public/index.html`, `public/lobby.js`: liittyminen ja uuden pelin luonti.
- `test/server.test.cjs`: oikeat HTTP-pyynnöt, samanaikaiset leimat, roolit ja levytallennuksen jatkuvuus.
- `.github/workflows/test.yml`: Node 24 -testit pushissa ja pull requestissa.
- `Dockerfile`, `compose.yaml`: siirrettävä palvelinkäynnistys pysyvällä volyymilla.

## Vielä varmistettava käyttöpaikassa

Julkisen hostingin HTTPS, pysyvä levy, osallistujien mobiiliselaimet sekä todellinen 15 opiskelijan yhtäaikainen luokkakuorma. Kapasiteettitestit tarkistavat 15 istunnon liittymisrajan, eivät simuloitua 70 minuutin kuormakoetta. Kriisi- ja liittosanomien palvelinreitit on testattu ohjelmallisesti; koko kriisipolkua ja kahden pelaajan liittoutumista ei ole tässä toimituksessa ajettu selaimen kautta päästä päähän. Docker-konfiguraatiota tai GitHub Actionsin ajoa ei ole paikallisesti merkitty suoritetuiksi.
