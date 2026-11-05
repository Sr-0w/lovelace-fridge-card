# Fridge Card — Configuration guide

## Native visual editor

Open **Home Assistant → Dashboard → Edit → Fridge Card → Edit**. The card now implements `getConfigElement()` with a native `ha-form` editor, searchable entity pickers, color swatches, and expandable groups. There is no need to edit YAML for normal configuration.

The editor is divided into **General**, **Entities**, **Colors and appearance**, **Modes**, and **Labels and thresholds**. Existing YAML settings and unrecognized settings are preserved.

### Supported entities

| Key | Domain | Function |
|---|---|---|
| `entities.fridge_temperature` | sensor | Actual fridge temperature |
| `entities.fridge_setpoint` | number | Fridge setpoint, native circular control and ± buttons |
| `entities.freezer_temperature` | sensor | Actual freezer temperature |
| `entities.freezer_setpoint` | number | Freezer setpoint |
| `entities.fridge_door`, `entities.freezer_door` | binary_sensor | Door-open alert (`on` = open) |
| `entities.power` | sensor | Current consumption (W) |
| `entities.filter_usage` | sensor | Filter usage in percent |
| `entities.quick_cool`, `entities.quick_freeze`, `entities.ice` | switch | Optional power/ice modes |

At least one temperature sensor is required. Other entities are optional, and absent controls disappear.

### Cooling arc direction

The native Home Assistant circular slider defaults to **cooling arc mode** (`appearance.cooling_arc: true`), using its built-in `mode="end"`. The filled track runs **from the target toward the warmer maximum**, and the highlighted interval represents cooling demand when the measured temperature is warmer than the target. The slider still reads and writes the **actual numeric temperature**: the + button increases the temperature setpoint (e.g. −19 → −18 °C), and − decreases it (−19 → −20 °C). Nothing reverses the number entity or its service call. Disable **Cooling arc** in the card editor if using this card with a system requiring a heating-style track (`mode="start"`).

### Colors, dimensions, information

Configure `colors.accent` (active buttons), `colors.fridge`, `colors.freezer` (circular arcs), `colors.track`, `colors.text`, `colors.warning`, and `colors.caution`. Use the color picker for hex colors, or type a CSS theme variable such as `var(--primary-color)` in the text field.

`appearance.dial_size` is the maximum diameter in pixels (default 300; constrained by column width), `appearance.dial_gap` the space between both dials (default 0), `appearance.button_size` the ± controls diameter (default 32), `appearance.mode_height` the mode strip button height (default 57), and `appearance.mode_icon_size` the mode icon size (default 22). The dashboard uses automatic grid height.

Visibility options: `show_header`, `show_measured`, `show_doors`, `show_power`, `show_filter`, `show_modes` (all true unless explicitly false).

`temperature_unit` overrides the default `°C`; each entity's `unit_of_measurement` attribute takes priority. Adjust `fridge_caution` (5 by default), `fridge_warn` (7), and `freezer_warn` (-15) in the same units as their sensors.

### Generic extra modes

The visual editor accepts one extra mode per line in this form:

```text
switch.my_fridge_eco | Eco | mdi:leaf
input_boolean.special_mode | Special | mdi:star
```

Equivalent YAML:

```yaml
extra_modes:
  - entity: switch.my_fridge_eco
    label: Eco
    icon: mdi:leaf
```

These additional modes are toggle actions on `switch` or `input_boolean` entities. Configure the three built-in modes through their own entity pickers. You may change their names under `labels`, icons under `mode_icons`, or the display order with a CSV `mode_order` such as `ice,quick_cool,quick_freeze`.

### Example

```yaml
type: custom:fridge-card
name: Réfrigérateur
detail_path: /dashboard-maison/cuisine-frigo
entities:
  fridge_temperature: sensor.my_fridge_temperature
  freezer_temperature: sensor.my_freezer_temperature
  fridge_setpoint: number.my_fridge_target
  freezer_setpoint: number.my_freezer_target
  fridge_door: binary_sensor.my_fridge_door
  power: sensor.my_fridge_power
colors:
  accent: "#FF6A00"
  fridge: "#009FCA"
  freezer: "#00BCD4"
appearance:
  dial_gap: 5
  button_size: 32
show_filter: false
```

All setpoint changes are explicit user actions via `number.set_value`. The card uses Home Assistant's own internal `ha-control-circular-slider`, `ha-big-number`, and `ha-outlined-icon-button`; cross-version compatibility is still under testing.
