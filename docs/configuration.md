# Fridge Card — configuration reference

Everything below can be set in the visual editor.

## General

| Option | Default | Description |
| --- | --- | --- |
| `device` | — | Device id. Its entities are discovered automatically. |
| `name` | device name | Title of the card. |
| `detail_path` | — | View opened by the ⋮ button. Without it, it opens the more-info dialog of a temperature entity. |
| `temperature_unit` | `°C` | Unit shown when an entity has none. |

## Entities

All optional when `device` is set; the ones you set override discovery. At
least one temperature or setpoint is needed.

| Key | Domain | Used for |
| --- | --- | --- |
| `fridge_temperature`, `freezer_temperature` | sensor | Measured temperature. |
| `fridge_setpoint`, `freezer_setpoint` | number, input_number, climate | Target temperature: dial and − / + buttons. A climate entity also gives the measured temperature. |
| `fridge_door`, `freezer_door`, `door` | binary_sensor | `on` when open. |
| `power` | sensor | Power. |
| `filter_usage` | sensor (%) | Filter used. |
| `filter_life` | sensor (%) | Filter life left (shown as used = 100 − left). |
| `filter_alert` | binary_sensor | *Replace filter* when `on`. |
| `quick_cool`, `quick_freeze`, `ice` | switch, input_boolean | Mode buttons. |

## Display

`show_header`, `show_measured`, `show_doors`, `show_power`, `show_filter`,
`show_modes`: all `true` by default. Parts without an entity are hidden anyway.

## Modes

| Option | Description |
| --- | --- |
| `mode_icons.quick_cool` / `.quick_freeze` / `.ice` | Icons of the built-in modes. |
| `mode_order` | Comma-separated order, e.g. `ice,quick_cool,quick_freeze`. |
| `extra_modes` | List of `{entity, label, icon}` for more switches. |

## Alerts

| Option | Default (°C / °F) | Meaning |
| --- | --- | --- |
| `fridge_warn` | 7 / 45 | Refrigerator *too warm* above this. |
| `fridge_caution` | 5 / 41 | Refrigerator *to watch* above this. |
| `freezer_warn` | −15 / 5 | Freezer *too warm* above this. |

Values are in the unit of your sensors. The defaults follow it.

## Colours

Theme colour name (`light-blue`, `primary`…), hex colour or `var(--…)`.

| Option | Default | Used for |
| --- | --- | --- |
| `colors.accent` | theme primary colour | Dials and active modes |
| `colors.fridge`, `colors.freezer` | `colors.accent` | One dial |
| `colors.track` | disabled colour | Dial track |
| `colors.text` | primary text | Setpoint numbers |
| `colors.warning` | error colour | Door open, too warm, filter |
| `colors.caution` | warning colour | To watch |

## Layout

`appearance.dial_size` (300 px max), `appearance.dial_gap` (0 px),
`appearance.button_size` (32 px), `appearance.mode_height` (57 px),
`appearance.mode_icon_size` (22 px), `appearance.cooling_arc` (`true`: the arc
fills from the setpoint towards warmer temperatures, like a cooling
thermostat; `false` fills from the minimum).

## Texts

`labels.<key>` overrides any text: `refrigerator`, `freezer`, `quick_cool`,
`quick_freeze`, `ice`, `doors_closed`, `door_open`, `filter`, `filter_replace`,
`attention`, `caution`, `details`, `measured`, `unavailable`.
