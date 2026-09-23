# Third-Party Notices

This file lists third-party software, data, APIs, map tiles, and astronomical data services used by **Nicole the Astronavigator**.

These notices apply only to the third-party components and services listed below. They do not, by themselves, define the license of Nicole the Astronavigator as a whole.

Last reviewed: 2026-09-23

---

## 1. Leaflet

Nicole loads **Leaflet 1.9.4** at runtime for interactive maps.

- Project: Leaflet
- Website: https://leafletjs.com/
- Source: https://github.com/Leaflet/Leaflet
- Version used: 1.9.4
- License: BSD 2-Clause
- Copyright: Volodymyr Agafonkin and contributors; CloudMade

Nicole currently loads Leaflet CSS and JavaScript from jsDelivr.

Upstream license:
https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE

---

## 2. OpenStreetMap / Nominatim

Nicole uses **OpenStreetMap** data through the public **Nominatim** service for place-name search and reverse geocoding.

- OpenStreetMap: https://www.openstreetmap.org/
- Copyright / attribution information: https://www.openstreetmap.org/copyright
- Nominatim: https://nominatim.org/
- Public Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/

OpenStreetMap data is made available under the **Open Database License (ODbL)**.

Required attribution is displayed in Nicole where OpenStreetMap / Nominatim data is used.

The public Nominatim service has its own usage policy in addition to the OpenStreetMap data license. Nicole is intended to comply with that policy, including attribution and request-rate limits.

---

## 3. Geospatial Information Authority of Japan (GSI)

Nicole uses map tiles and/or elevation-related information provided by the **Geospatial Information Authority of Japan (GSI)**.

- GSI website: https://www.gsi.go.jp/
- GSI Maps: https://maps.gsi.go.jp/
- GSI tile list / technical information: https://maps.gsi.go.jp/development/ichiran.html

Unless otherwise stated by GSI, content is subject to the **Public Data License (Version 1.0)** and the applicable GSI terms of use.

Source attribution to GSI is displayed in Nicole where applicable.

If GSI content is modified or processed for presentation, the applicable GSI terms regarding indication of modification also apply.

---

## 4. Open-Meteo

Nicole uses **Open-Meteo** for weather forecast information such as cloud cover, precipitation, temperature, humidity, wind, and visibility.

- Service: https://open-meteo.com/
- Terms: https://open-meteo.com/en/terms
- Data license: Creative Commons Attribution 4.0 International (CC BY 4.0)

Weather data obtained through Open-Meteo must be attributed as required by CC BY 4.0 and Open-Meteo's terms.

Nicole currently uses the free API for non-commercial use. If Nicole is later monetized, used commercially, or exceeds the applicable free-service limits, the Open-Meteo service plan and terms must be reviewed again.

Suggested attribution:

> Weather data by Open-Meteo.com — CC BY 4.0

---

## 5. NASA Earthdata / GIBS / VIIRS Night Lights

Nicole uses imagery or tile data from **NASA Earthdata / GIBS**, including **VIIRS Night Lights**, as a reference for nighttime light pollution / artificial night-light conditions.

- NASA Earthdata: https://earthdata.nasa.gov/
- NASA GIBS: https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs
- Earthdata data-use and citation guidance: https://www.earthdata.nasa.gov/

Nicole uses this material only as a reference display. It is not presented as a Bortle-class or SQM measurement.

NASA and Earthdata request appropriate citation of datasets and products used in published or redistributed works.

---

## 6. NASA / JPL Small-Body Observability API and Horizons

Nicole uses services provided by **NASA Jet Propulsion Laboratory (JPL)** for comet discovery and positional calculations.

Services include:

- JPL Small-Body Observability API
- JPL Horizons API

References:

- JPL Solar System Dynamics: https://ssd.jpl.nasa.gov/
- Horizons: https://ssd.jpl.nasa.gov/horizons/
- Horizons API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html

Nicole's Cloudflare Worker may send observation coordinates, observation time, and comet identifiers to JPL in order to obtain comet visibility and apparent position data.

JPL-derived positions are identified in Nicole as high-precision / Horizons-based calculations where applicable.

NASA/JPL services and datasets remain subject to their own terms, service availability, and citation guidance.

---

## 7. Hipparcos Planetarium Data Creator / Stellarium-derived constellation-line data

Nicole loads constellation-line data from:

**Hipparcos Planetarium Data Creator**

- Repository: https://github.com/creativival/hipparcos_planetarium_data_creator
- License stated by the project: GNU General Public License v2.0 (GPLv2)

Nicole currently uses data files including:

- `hip_constellation_line.csv`
- `hip_constellation_line_star.csv`

The upstream project states that its constellation data is derived from **Stellarium** constellation data and is used under GPLv2.

Upstream notice:
https://github.com/creativival/hipparcos_planetarium_data_creator

Because this dataset includes GPLv2-derived constellation data, redistribution of these files or derivative copies should preserve the applicable GPLv2 notices and license terms.

This notice does not make any separate determination about the license of Nicole's independently written source code.

---

## 8. d3-celestial / Milky Way outline data

Nicole can load Milky Way outline geometry derived from **d3-celestial**.

- Project: d3-celestial
- Repository: https://github.com/ofrohn/d3-celestial
- License: BSD 3-Clause
- Author: Olaf Frohn

Nicole may load Milky Way geometry from:

- https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/mw.json
- https://raw.githubusercontent.com/sergio-dr/mw_geojson/main/mw_simplified_43p.json

The `mw_geojson` repository states that its Milky Way geometry is based on the data provided by d3-celestial, with cleanup by Diego Hernangómez.

- `mw_geojson`: https://github.com/sergio-dr/mw_geojson

Upstream d3-celestial license:
https://github.com/ofrohn/d3-celestial/blob/master/LICENSE

If these data files are copied into the Nicole repository or redistributed directly, preserve the applicable upstream copyright and BSD license notices.

---

## 9. Hoshinotori

**Hoshinotori / 星の鳥** is a companion comet database created for Nicole.

- Project page: https://kensukesuga86.github.io/Hoshinotori/

Hoshinotori is part of the Nicole project ecosystem and is not listed here as a third-party dependency. Any external astronomical data used by Hoshinotori remains subject to the terms of its original providers.

---

## 10. External services and availability

Some Nicole features depend on third-party services that are not bundled with Nicole and may change, impose rate limits, become temporarily unavailable, or change their terms.

These include, among others:

- Open-Meteo
- OpenStreetMap / Nominatim
- GSI map services
- NASA Earthdata / GIBS
- NASA/JPL APIs
- GitHub / GitHub Pages
- jsDelivr

Nicole does not control the availability or continued compatibility of these external services.

---

## 11. No warranty from third-party providers

Third-party software, data, and services are provided under their respective licenses and terms. Their inclusion or use in Nicole does not imply endorsement of Nicole by those providers.

Where an upstream license includes a disclaimer of warranty or limitation of liability, that disclaimer remains applicable according to the terms of that license.

---

## 12. Maintaining this file

When adding a new external library, dataset, map source, API, font, image set, or astronomical catalog to Nicole, update this file before publishing the change.

At minimum, record:

1. Name of the component or service
2. What Nicole uses it for
3. Source / official website
4. License or terms of use
5. Required attribution
6. Any redistribution restrictions
7. Any rate-limit or commercial-use restrictions

For components whose license requires retention of the complete license text, it is recommended to also keep a copy under a repository directory such as:

`LICENSES/`

Example:

- `LICENSES/Leaflet-BSD-2-Clause.txt`
- `LICENSES/d3-celestial-BSD-3-Clause.txt`
- `LICENSES/hipparcos-planetarium-data-creator-GPL-2.0.txt`

---

## Project note

This document is intended to preserve attribution and third-party licensing information for Nicole the Astronavigator. It is not legal advice.
