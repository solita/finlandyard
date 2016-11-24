#Finland yard

## Kehittäminen

Softa paketoidaan webpackillä.

```
# Asenna riippuvuudet
npm install
# Aja testit
npm run test
```

```
# Pystytä proxy
cd bouncer
npm run proxy
# Devaa livenä (toisessa terminaalissa)
npm run dev
```

Tuo proxy ikäänkuin välimuistittaa persistentisti apin tarjoamia json bodyjä bouncer/.store/ lokaatiossa. Tämän avulla ei myöskään tarvitse käyttää mitään ulkoista cors-anywhere systeemiä. Tosin, rata.digitraffic api lisää vastauksiin Access-Control-Allow-Origin headerin. 

Testit sijaitsee spec/ ja koodi src-hakemistoissa.

## Suunnitelmat

- Aikaintervallit kinda vuoroja (esim. 15min = 1 "vuoro")
- Kun rosvo saapuu kaupunkiin, tekee päätökseen lähteekö jollain junalla tai päättääkö jäädä kaupunkiin
	- Jos rosvo haluaa lähteä vasta esim 2h päästä menevällä junalla, se joutuu odottamaan sen aikaa ja voi vielä muuttaa suunnitelmiaan ennen lähtöä
	- Kesken matkan ei saa muuttaa suunnitelmia (junassa matkalla johonkin)
	- poliisit voivat liikkua kun rosvo matkalla/odottaa junaa kaupungissa

- lukee maailman tilan -> tekee päätöksen -> saa seuraavan maailman tilan
- poliisille pätee samat säännöt kuin rosvoille

- Joku tarina siihen alotukseen, esim rosvo karkaa Hämeenlinnasta, poliiseja tippuu etsimään esim Pasilasta jonkin ajan välein?

- Visualisoinnissa vois näkyä missä rosvo(t)/poliisi(t) ovat nyt ja minne rosvo(t) menevät seuraavaksi

- Esimerkki-AI rosvolle (joka vaan arpoo)

- Poliisien etäisyys tulee voida laskea pidemmilläkin matkoilla, mutta liikkuminen (rosvoilla ja poliiseilla) tapahtuu vain vierekkäisiin kaupunkeihin kerralla

Tarjotaan kilpailijoille seuraavat tiedot:
- yhteydet muualle
- ajat koska lähtee
- poliisien sijainnin perusteella kauanko kestää kaupunkiin X

Visualisointi, pelin logiikka

visualisointi:
- open layers (https://openlayers.org/en/latest/examples/)

- tallennetaan jsonina pelin kulku??
	- sisältää pelejä, jotka sisältävät jokaisen poliisin ja rosvojen sijainnit, ja ajanhetket
- piirto tapahtuisi "jäljessä" vaikka peli olis jo päättynyt

- X siirron jälkeen rosvo voittaa/kuinka monta poliisia kartalla ennenkö jää kiinni


## Aikataulujen perusteella reittien piirto

Dusasin Nikon reitinpiirron perusteella kaikki reitit kartalle. Ohessa screenshotti, en viitsi sitä commitoida koska en oikein vielä tiedä, miten tämä kannattaa tehdä.

Oheinen kuva on piirretty tällä:
https://rata.digitraffic.fi/api/v1/schedules?departure_date=2015-03-01

Periaatteessa kai tuo json sisältäisi kaiken mitä "yhden päivän pyörittämiseen" tarvitaan?

![Reitit](https://github.com/annisall/finlandyard/planning_docs/routes.png?raw=true "Reitit")
