# Fridge Card for Home Assistant

A compact, device-agnostic Lovelace card with an appliance illustration, fridge/freezer temperatures, door status, instant power, filter usage, and up to three optional switch controls.

**Status: 0.1.0 development prototype.** The UI has been tested with simulated states, but has **not yet been validated on a live Home Assistant instance**. Please test it as a custom repository before creating a public release.

![Fridge Card concept preview](docs/preview.svg)

## Install (development branch)

1. In **HACS / Marketplace**, add this repository as a **custom Dashboard repository**:
   `https://github.com/Sr-0w/lovelace-fridge-card`
2. Install **Fridge Card**.
3. Reload Home Assistant in your browser.
4. If the resource was not registered automatically, add `/hacsfiles/lovelace-fridge-card/fridge-card.js` as a **JavaScript module** in **Settings → Dashboards → Resources**.
5. Add a **Manual** dashboard card and configure your entities.

## Example

```yaml
type: custom:fridge-card
name: Réfrigérateur
detail_path: /dashboard-maison/cuisine-frigo
entities:
  fridge_temperature: sensor.my_fridge_temperature
  freezer_temperature: sensor.my_freezer_temperature
  fridge_door: binary_sensor.my_fridge_door
  freezer_door: binary_sensor.my_freezer_door
  power: sensor.my_fridge_power
  filter_usage: sensor.my_water_filter_usage
  quick_cool: switch.my_fridge_power_cool
  quick_freeze: switch.my_freezer_power_freeze
  ice: switch.my_ice_maker
fridge_warn: 7
fridge_caution: 5
freezer_warn: -15
labels:
  refrigerator: Réfrigérateur
  freezer: Congélateur
  normal: Normal
  alert: Alerte
  caution: À surveiller
  door_open: Porte ouverte
  doors_closed: Portes fermées
  quick_cool: Froid+
  quick_freeze: Congél+
  ice: Glaçons
```

Only `fridge_temperature` **or** `freezer_temperature` is required. All other entities are optional; absent controls are hidden. Door binary sensors are expected to be `on` when open, and the optional filter sensor must report **percentage used**. Power is shown in watts. `quick_cool`, `quick_freeze`, and `ice` must be switch entities.

The configurable `detail_path` links to an **existing** Home Assistant view; the card does not create that view. With no detail path, the button opens entity more-info.

## Portability and permissions

All entity IDs are supplied in YAML. There is **no manufacturer SDK**, no backend service, and no network request outside Home Assistant's built-in card interface. Actions are sent through `hass.callService('switch', 'toggle', ...)` and use the current HA user's permissions.

## Planned before HACS catalog submission

- Live validation on different Home Assistant versions and phone/tablet/desktop layouts
- GUI editor and translations
- Better availability/error handling and configurable thresholds/units
- Tests, accessibility checks, and tagged releases

MIT license. Contributions welcome.