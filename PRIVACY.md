# Tietosuoja ja yksilön tietoturva — toteutuskuvaus

Päivitetty 1.11.2026. Tämä kuvaa teknistä toteutusta ja sen rajoja. Se ei ole korkeakoulun hyväksymä tietosuojaseloste, vaikutustenarviointi tai todistus GDPR-vaatimustenmukaisuudesta.

## Oikea datavirta

1. GitHub säilyttää tämän sovelluksen lähdekoodin. Opiskelijan työtä ei commitoida GitHubiin. Render ja Supabase ovat GitHubista erillisiä palveluntarjoajia, vaikka ylläpitäjä kirjautuisi niihin GitHub-tunnuksella.
2. Verkkopelaaja avaa Renderin HTTPS-sivun ja käyttää satunnaista työtunnusta. Selain lähettää työn sisällön Renderin pelipalvelimelle. Palvelin tallentaa huoneen, työt ja käyttöoikeustiedot Supabaseen.
3. Muut pelaajat näkevät tunnukset ja saavat sisältöä liittoutumistoiminnolla. Pelinjohtaja ja opettajat näkevät huoneensa työt. Julkinen tieto ei tarkoita, että tietokanta olisi julkisesti luettava: Supabase-taulun RLS on päällä, anon/authenticated-oikeudet on poistettu ja vain palvelin käyttää secret-avainta.
4. Pelaaja vie minimoidun JSON-työtiedoston. Tiedosto sisältää työtunnuksen ja työn ydinsisällön. Se ei sisällä kirjautumistunnuksia, opettaja-avaimia, allekirjoituksia tai koko luokan lokia.
5. Sama tiedosto voidaan avata mukana toimitetussa Kaksoistimantti-HTML:ssä. Tämä HTML käsittelee työn paikallisesti selaimessa ja vie sen samalla tunnuksella takaisin JSONiksi. Verkkopeliin tehtävä paluutuonti kertoo ennen vahvistusta, että sisältö lähetetään Renderin kautta Supabaseen.
6. Opiskelija palauttaa JSONin Moodlen tehtävään omalla virallisella Moodle-käyttäjällään. Korkeakoulu säilyttää mahdollisen henkilö–pseudonyymi-yhdistämistiedon Moodlessa tai muussa hyväksytyssä ympäristössä. Sitä ei syötetä tähän verkkopeliin.

## Tunniste ei ole henkilöllisyystodistus

Oletus on kryptografisesti satunnainen 64-bittinen tunnus, esimerkiksi `DD-A1B2C3D4E5F60718`, ilman oikeita nimikirjaimia. Palvelin estää saman tunnuksen kaksoisliittymisen samassa roolissa ja pelissä. Tunnus ei ole istunnon salaisuus; käyttöoikeus perustuu erilliseen satunnaiseen istuntotunnisteeseen.

Myös opettajan Moodlessa antama muoto `MI-6482` voidaan ottaa vastaan yhteensopivuutta varten. Se ei ole oletus: nimikirjaimet paljastavat lisätietoa, neljä numeroa ei takaa törmäyksettömyyttä eikä koodin tarkistaminen todista työn tekijää. Alkuperäinen esimerkkifunktio ei myöskään poimi koko nimestä nimikirjaimia vaan katkaisee puhdistetun merkkijonon. Oikeaa nimeä ei siksi kysytä tunnuksen generointiin lainkaan.

## JSON-siirron sisältö ja rajat

- Versioitu muoto `double-diamond-transfer`, `formatVersion: 1`, `studentId` sekä natiivin Kaksoistimantti v1:n ydinkentät.
- Säilyvät haaste, kohderyhmä, oletukset, löydöt, oivallukset, kriteerit, toimeksianto, konseptit, painot, pisteet, seulonnan ydinkentät, valinta ja oma reflektio.
- Profiilin nimi, ohjaajan nimi, kuvat, vertaisoppimisen henkilömetat, avaimet, istuntotunnisteet ja tekninen tapahtumaloki eivät kuulu opiskelijan siirtotiedostoon. Kaikkea alkuperäisen työkalun teknistä tilaa tai kuva-aineistoa ei siirretä.
- Tuonti ei anna verkkoistuntoa, opettajan oikeuksia, luotsin hyväksyntää tai virallista arvosanaa. Elävässä pelissä tuodun tiedoston tunnuksen pitää vastata istunnon tunnusta.
- Tiedoston enimmäiskoko 1 MB; rakenteen syvyys, tunnisteet, pisteiden arvot ja tiedostoversio tarkistetaan. Tuntemattomat kentät jätetään pois ja prototyyppimuutoksiin käytettävät kentät hylätään. Vapaa teksti käsitellään tekstinä.
- SHA-tiiviste tai käyttäjän itsensä tuottama JSON ei yksin todista aitoutta. Tiedostoa voi muokata. Arvioinnin tekijyys ja eheys varmistetaan Moodlen palautus- ja arviointikäytännöillä, ei pelkällä `studentId`-kentällä.

## Säilytys ja poistaminen

Uuden pelin palvelintietojen käyttö päättyy seitsemän vuorokauden kuluttua pelin luonnista. Vanhentunut peli poistetaan sitä avattaessa. Käynnistyksen ja käynnissä olevan palvelun tunnittainen siivous poistavat vanhentuneita huoneita; Render Free -palvelun nukkuessa siivous ei käy. Fyysinen poisto voi siksi tapahtua vasta seuraavan käynnistyksen yhteydessä. Palveluntarjoajan mahdollisten varmuuskopioiden säilytysaika on eri asia, eikä sovelluksen poistopainike poista niitä.

Pelinjohtaja voi poistaa koko pelin palvelimelta vahvistuksen jälkeen. Tällöin huone ja sen istunnot poistuvat, mutta aiemmin ladatut tiedostot ja osallistujien paikalliset luonnokset eivät katoa etänä. Kullakin laitteella on **Unohda istunto tällä laitteella** -toiminto. Se poistaa kyseisen istunnon paikalliset tunnisteet ja luonnoksen, ei muiden laitteiden tietoja tai Moodle-palautusta. Toiminto ei poista selaimen latauskansion JSON-tiedostoja.

Pelinjohtajan koko pelin varmuuskopio on opiskelijan tiedostoa laajempi. Se sisältää työaineiston lisäksi opettajatunnuksen ja allekirjoitusavaimen. Se on vain ohjaajan säilytettäväksi, ei jaettavaksi opiskelijoille.

## Mitä pseudonymisointi ei ratkaise

Pseudonymisoidut tiedot voivat edelleen olla henkilötietoja, jos henkilö on tunnistettavissa lisätietojen avulla. Myös vapaat muistiinpanot, harvinainen yritysidea, nimikirjaimet tai pienryhmän tilanne voivat tunnistaa henkilön. Sovellus ei pysty takaamaan, ettei käyttäjä kirjoita henkilötietoja tekstikenttiin. Siksi nimien, opiskelijanumeroiden, sähköpostien ja arkaluonteisten tietojen kirjoittaminen on kielletty käyttöohjeessa, myös asiakas- ja haastattelumuistiinpanoissa.

Palveluntarjoajat voivat käsitellä IP-osoitteita ja muita teknisiä yhteystietoja. EU-alueen valinta ja pseudonyymi eivät yksin ratkaise kaikkia henkilötietojen käsittelyn tai kansainvälisten siirtojen vaatimuksia.

Ennen oikeaa opiskelijakäyttöä korkeakoulu ratkaisee rekisterinpitäjän vastuut, käsittelyperusteen, käsittelijäsopimukset, informoinnin, käyttöoikeudet, säilytysajat ja hyväksytyt palvelut. Moodlen käyttö ei itsessään tee ulkopuolisen palvelun käsittelystä automaattisesti sallittua. Tässä ei ole väitetty korkeakoululain vaatimusten täyttyvän automaattisesti.

Lähteet: [GDPR, erityisesti 4(5), 5, 25 ja 32 artikla](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng/), [EDPB: anonymisointi ja pseudonymisointi](https://www.edpb.europa.eu/topics/ai-and-technology/anonymisation-pseudonymisation_en).

## Moodle ja virallinen arviointi

Mukana toimitettu HTML ei lue Moodle-käyttäjätunnusta, luo henkilö–tunnus-rekisteriä tai kirjoita arviointiprofiiliin. Näihin tarvitaan hyväksytty Moodle-lisäosa, LTI tai muu palvelinpuolen integraatio oikeuksineen. Tavallinen HTML-sivu tai JSONin `studentId` ei ohita tätä rajaa.

Tässä toteutuksessa tunnuksen ja virallisen henkilön yhteys syntyy korkeakoulun hallitsemassa Moodle-tehtäväpalautuksessa. Sama HTML on ladattavissa myös itsenäisenä paikallisena tiedostona: silloin työn sisältö ei tarvitse pilvitallennusta, mutta verkkopelin yhteiset toiminnot eivät ole käytössä.
