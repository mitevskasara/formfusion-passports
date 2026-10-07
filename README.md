# @formfusion/passports

Set of validation rules for worldwide passport numbers, used for the [FormFusion](https://www.corelabui.com/formfusion) (form management & validation) library.

A zero-dependency lookup table of **60 country-specific regex patterns** for validating passport numbers. Every value is a regex **string** (no `null`s, no empty placeholders) and works directly as an HTML [`pattern`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern) attribute value, so you can use it with plain HTML, React, FormFusion, or `new RegExp()`.

## Why

Passport number formats differ per country more than most identity fields. The US and the UK are nine plain digits, Germany is nine characters drawn from a vowel-free alphabet (`CFGHJKLMNPRTVWXYZ` plus digits), China splits into ordinary (`G`) and electronic (`E`) series and skips `I`/`O` in the latter, France interleaves digits and letters (`12AB12345`), the Netherlands mixes two letters with six alphanumerics and a final digit, South Korea and Malaysia restrict the first letter to a passport series (`M`/`S` and `A`/`H`/`K`), India allows an optional hyphen after its first letter, and Mexico and Romania accept variable lengths. Every app that collects a passport number ends up re-implementing and re-maintaining this table.

This package ships it as one flat object so you don't have to.

## Installation

```bash
npm install @formfusion/passports
```

```bash
yarn add @formfusion/passports
```

## Usage

The package exports a single default object mapping lowercase ISO 3166-1 alpha-2 country codes to regex **strings**.

### ES modules

```js
import passports from '@formfusion/passports';

console.log(passports.us); // "^\\d{9}$"
```

### CommonJS

```js
const passports = require('@formfusion/passports').default;

new RegExp(passports.us).test('123456789'); // true
new RegExp(passports.us).test('12345'); // false
```

### Plain HTML

The patterns are valid `pattern` attribute values, so they work without any JavaScript:

```html
<label for="passport">Passport number (United States)</label>
<input id="passport" name="passport" type="text" pattern="^\d{9}$" required />
```

### With FormFusion

FormFusion passes unknown `type` values straight through to the input's `pattern` attribute, so you can hand it a pattern directly:

```jsx
import React from 'react';
import { Form, Input } from 'formfusion';
import 'formfusion/style.css';
import passports from '@formfusion/passports';

const MyForm = () => (
  <Form onSubmit={(data) => console.log('Submitted', data)}>
    <Input id="passport" name="passport" type={passports.de} label="Passport number" required />
    <button type="submit">Submit</button>
  </Form>
);
```

To accept more than one country, build a single alternation yourself. Strip each pattern's own anchors and share one pair across the branches so the result stays fully anchored:

```jsx
import { Input } from 'formfusion';
import passports from '@formfusion/passports';

// Accept either a German or a French passport number
const either = `^(?:${[passports.de, passports.fr].map((p) => p.slice(1, -1)).join('|')})$`;

<Input name="passport" type={either} label="Passport number" required />
```

### Dynamic country selection

```jsx
const [country, setCountry] = useState('de');

<Select name="country" value={country} onChange={setCountry}>
  {Object.keys(passports).map((code) => (
    <option key={code} value={code}>
      {code.toUpperCase()}
    </option>
  ))}
</Select>

<Input name="passport" type={passports[country]} label="Passport number" required />
```

### Standalone validation

```js
import passports from '@formfusion/passports';

export function isValidPassport(value, country) {
  const pattern = passports[String(country).toLowerCase()];
  if (!pattern) return false; // unknown country
  return new RegExp(pattern).test(String(value).toUpperCase()); // most patterns are uppercase-only
}

isValidPassport('123456789', 'US'); // true
isValidPassport('12345', 'us'); // false
```

### TypeScript

Typings are hand-written in `index.d.ts` and mirror the runtime exactly — all **60 keys** are declared, uppercase in the `Passports` type and lowercased via a mapped type (`LowercaseKeys`) so the exported keys match the runtime object. Because the declaration uses `export =`, you need `esModuleInterop` or `allowSyntheticDefaultImports`.

```ts
import passports from '@formfusion/passports';

const us: string = passports.us;
// @ts-expect-error - unknown country
const xx: string = passports.xx;
```

## API

The export is a plain object with no functions or classes:

```ts
{ [countryCode: string]: string }
```

Country codes are **lowercase** (`us`, `de`, `jp`). Lookups are case-sensitive, so normalize user input first.

Every entry is a string — unlike `@formfusion/vat`, there are no `null` entries and no empty placeholder patterns. Enumerate the available codes with `Object.keys(passports)`.

**Prefixes are an accident of the national format.** No pattern contains an ISO 3166 country prefix (there is no `(US)?` or `(DE)?` anywhere), unlike `@formfusion/vat`, where the prefix is optional in every pattern. Whether a country-looking prefix passes depends on the shape underneath: `jp` accepts `JP1234567` only because Japanese numbers start with two letters (`nl`, `fi`, `gr` and `pk` behave the same way), while pure-digit formats like `us`, `gb` and `bg` reject `US1234567` outright, and `de` rejects `DE1234567` because `D` and `E` are not in its alphabet. Some patterns do require a leading letter as part of the national format — `is` demands `A`, `sl` demands `P`, `kr` accepts only `M` or `S` — but those are series characters, not country codes.

Coverage: 60 countries across Europe, the Americas, Asia, Africa, and Oceania, including all 27 EU member states. Greece is keyed `gr` (the ISO code, not the EU-standard `el` used by `@formfusion/vat`). Slovenia is keyed `sl` — the source comments it as SLOVENIA, though Slovenia's ISO 3166-1 code is `si` and `sl` belongs to Sierra Leone.

## Caveats

Read these before relying on the patterns.

**Format only, no checksum.** These are shape checks. Passport numbers carry no checksum in most countries, and nothing here reads the MRZ or checks the issuing authority. A well-formed number that does not exist will pass. For authoritative verification you need the issuing authority's own service.

**Partial anchoring in `mz` and `ph`.** Both are top-level alternations where only the first branch carries `^` and only the second carries `$` (`^([A-Z]{2}\d{7})|(\d{2}[A-Z]{2}\d{5})$`). With `new RegExp(...)`, `mz` accepts `AB1234567TRAILING` and `XY12AB12345`, and `ph` accepts `A123456TRAILING`. When used in an HTML `pattern` attribute, the browser implicitly anchors the whole value as `^(?:…)$`, which mitigates this. `cn` is also a top-level alternation, but each of its branches is fully anchored (`^G\d{8}$|^E…$`), so it is safe.

**`cn` uses a negative lookahead.** `(?![IO])` is valid JavaScript and works in the HTML `pattern` attribute, but not every regex dialect supports lookarounds — RE2-style engines (Go, PostgreSQL's `~`) will reject it. For those engines rewrite the branch as `^E[0-9A-HJ-NP-Z]\d{7}$`, which is equivalent.

**Case handling.** Most patterns only accept uppercase letters. `kz` and `li` accept either case (`[a-zA-Z]`), and `jm` and `nz` spell out case pairs (`[Aa]`, `[Ll]([Aa]|…)`). Uppercasing input before testing is safe for every entry.

**FormFusion's `rules.existIn` escapes its input.** It is meant for literal lists, so passing full patterns in escapes their metacharacters and turns them into literal text matches. Compose a single alternation yourself instead (see Usage).

**Keys are lowercased at runtime.** `index.d.ts` declares uppercase keys (`US`, `DE`) and maps them to lowercase for the exported type; the built `index.js` exposes lowercase keys only.

## Development

```bash
git clone https://github.com/mitevskasara/formfusion-passports.git
cd formfusion-passports
npm install
npm run build
```

### How it works

All source lives in [`src/index.js`](src/index.js) as a single object of uppercase country codes. The last step lowercases every key before exporting, so `US` becomes `us`.

[`esbuild.js`](esbuild.js) bundles that into a minified CommonJS `index.js` at the repo root, targeting Node 14. Consumers get the built file, so **changes are not live until you rebuild and commit `index.js`**:

```bash
npm run build
```

This repo has no tests and no CI. If you add a pattern, add a corresponding test in the [FormFusion](https://github.com/corelabui/formfusion) repo — its suite renders one `<Input>` per country with Jest + React Testing Library (see `src/__tests__/postalCodes/`, which contains a file per country).

### Scripts

| Script | Description |
| --- | --- |
| `npm run build` | Clean stale build output, then bundle `src/index.js` into `index.js` via esbuild |
| `npm version <patch\|minor\|major>` | Bump the version and regenerate `CHANGELOG.md` from Conventional Commits (runs `npm run version` automatically) |
| `npm run publish-package` | `npm publish --access public` |

The `version` script shells out to `conventional-changelog`, which is not declared in `devDependencies`. Install it globally or add it as a dev dependency before running a version bump.

### Commit convention

This repo follows [Conventional Commits](https://www.conventionalcommits.org/), and `CHANGELOG.md` is generated from those subjects:

```
Feat: add Nepali passport pattern
Fix: anchor the second Mozambique branch
```

### Adding a country

1. Add the entry to `src/index.js`, using an uppercase country code.
2. Add the uppercase key to the `Passports` type in `index.d.ts`.
3. Run `npm run build` and commit the regenerated `index.js`.
4. Add a test in the FormFusion repo following the `src/__tests__/postalCodes/` per-country layout.

## Related packages

Part of the FormFusion family of extracted validation rule sets:

- [`@formfusion/postcodes`](https://www.npmjs.com/package/@formfusion/postcodes)
- [`@formfusion/licence-plates`](https://www.npmjs.com/package/@formfusion/licence-plates)
- [`@formfusion/iban`](https://www.npmjs.com/package/@formfusion/iban)
- [`@formfusion/phones`](https://www.npmjs.com/package/@formfusion/phones)
- [`@formfusion/tin`](https://www.npmjs.com/package/@formfusion/tin)
- [`@formfusion/vat`](https://www.npmjs.com/package/@formfusion/vat)
- [`formfusion`](https://www.npmjs.com/package/formfusion) — the core library

## Issues

Report bugs and feature requests at https://github.com/mitevskasara/formfusion-passports/issues.

## License

BSD-2-Clause. Copyright (c) 2023, Mitevska Sara.
