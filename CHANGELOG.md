# Changelog

All notable changes to this project will be documented in this file.

## 📚 Documentation
- Docs: add README/SPEC/PLAN (`eadd3ab`)
## 🔨 Other
- Chore(governance): adopt CLAUDE.md + governance framework

Enable AgilePlus spec tracking, FR traceability, and standard project conventions. Wave-5 governance push.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com> (`bf7679b`)
- Chore: add AgilePlus scaffolding (`d1efe3b`)
- Ci(legacy-enforcement): add legacy tooling anti-pattern gate (WARN mode)

Adds legacy-tooling-gate.yml monitoring per CLAUDE.md Technology Adoption Philosophy.

Refs: phenotype/repos/tooling/legacy-enforcement/ (`526a253`)
- Bump the go_modules group across 1 directory with 6 updates (#3)

Bumps the go_modules group with 5 updates in the /localbase-chain directory:

| Package | From | To |
| --- | --- | --- |
| [filippo.io/edwards25519](https://github.com/FiloSottile/edwards25519) | `1.0.0` | `1.1.1` |
| [github.com/cometbft/cometbft](https://github.com/cometbft/cometbft) | `0.38.19` | `0.38.21` |
| [github.com/golang/glog](https://github.com/golang/glog) | `1.2.3` | `1.2.4` |
| [golang.org/x/crypto](https://github.com/golang/crypto) | `0.33.0` | `0.45.0` |
| [google.golang.org/grpc](https://github.com/grpc/grpc-go) | `1.70.0` | `1.79.3` |



Updates `filippo.io/edwards25519` from 1.0.0 to 1.1.1
- [Commits](https://github.com/FiloSottile/edwards25519/compare/v1.0.0...v1.1.1)

Updates `github.com/cometbft/cometbft` from 0.38.19 to 0.38.21
- [Release notes](https://github.com/cometbft/cometbft/releases)
- [Changelog](https://github.com/cometbft/cometbft/blob/main/CHANGELOG.md)
- [Commits](https://github.com/cometbft/cometbft/compare/v0.38.19...v0.38.21)

Updates `github.com/golang/glog` from 1.2.3 to 1.2.4
- [Release notes](https://github.com/golang/glog/releases)
- [Commits](https://github.com/golang/glog/compare/v1.2.3...v1.2.4)

Updates `golang.org/x/crypto` from 0.33.0 to 0.45.0
- [Commits](https://github.com/golang/crypto/compare/v0.33.0...v0.45.0)

Updates `golang.org/x/net` from 0.35.0 to 0.47.0
- [Commits](https://github.com/golang/net/compare/v0.35.0...v0.47.0)

Updates `google.golang.org/grpc` from 1.70.0 to 1.79.3
- [Release notes](https://github.com/grpc/grpc-go/releases)
- [Commits](https://github.com/grpc/grpc-go/compare/v1.70.0...v1.79.3)

---
updated-dependencies:
- dependency-name: filippo.io/edwards25519
  dependency-version: 1.1.1
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: github.com/cometbft/cometbft
  dependency-version: 0.38.21
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: github.com/golang/glog
  dependency-version: 1.2.4
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: golang.org/x/crypto
  dependency-version: 0.45.0
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: golang.org/x/net
  dependency-version: 0.47.0
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: google.golang.org/grpc
  dependency-version: 1.79.3
  dependency-type: indirect
  dependency-group: go_modules
...

Signed-off-by: dependabot[bot] <support@github.com>
Co-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com> (`5926608`)
- Bump the npm_and_yarn group across 2 directories with 17 updates (#5)

Bumps the npm_and_yarn group with 6 updates in the /localbase-api directory:

| Package | From | To |
| --- | --- | --- |
| [axios](https://github.com/axios/axios) | `1.12.2` | `1.13.6` |
| [bn.js](https://github.com/indutny/bn.js) | `5.2.2` | `5.2.3` |
| [bn.js](https://github.com/indutny/bn.js) | `4.12.2` | `4.12.3` |
| [js-yaml](https://github.com/nodeca/js-yaml) | `3.14.1` | `3.14.2` |
| [jws](https://github.com/brianloveswords/node-jws) | `3.2.2` | `3.2.3` |
| [minimatch](https://github.com/isaacs/minimatch) | `3.1.2` | `3.1.5` |
| [qs](https://github.com/ljharb/qs) | `6.13.0` | `6.14.2` |

Bumps the npm_and_yarn group with 11 updates in the /localbase-frontend directory:

| Package | From | To |
| --- | --- | --- |
| [axios](https://github.com/axios/axios) | `1.12.2` | `1.13.6` |
| [bn.js](https://github.com/indutny/bn.js) | `5.2.2` | `5.2.3` |
| [bn.js](https://github.com/indutny/bn.js) | `4.12.2` | `4.12.3` |
| [cookie](https://github.com/jshttp/cookie) | `0.4.2` | `removed` |
| [form-data](https://github.com/form-data/form-data) | `2.3.3` | `4.0.5` |
| [js-yaml](https://github.com/nodeca/js-yaml) | `3.14.1` | `3.14.2` |
| [minimatch](https://github.com/isaacs/minimatch) | `3.1.2` | `3.1.5` |
| [next](https://github.com/vercel/next.js) | `14.2.32` | `15.5.14` |
| [@tootallnate/once](https://github.com/TooTallNate/once) | `2.0.0` | `removed` |
| [diff](https://github.com/kpdecker/jsdiff) | `5.2.0` | `5.2.2` |
| [flatted](https://github.com/WebReflection/flatted) | `3.3.3` | `3.4.2` |
| [prismjs](https://github.com/PrismJS/prism) | `1.27.0` | `1.30.0` |



Updates `axios` from 1.12.2 to 1.13.6
- [Release notes](https://github.com/axios/axios/releases)
- [Changelog](https://github.com/axios/axios/blob/v1.x/CHANGELOG.md)
- [Commits](https://github.com/axios/axios/compare/v1.12.2...v1.13.6)

Updates `bn.js` from 5.2.2 to 5.2.3
- [Release notes](https://github.com/indutny/bn.js/releases)
- [Changelog](https://github.com/indutny/bn.js/blob/master/CHANGELOG.md)
- [Commits](https://github.com/indutny/bn.js/compare/v5.2.2...v5.2.3)

Updates `bn.js` from 4.12.2 to 4.12.3
- [Release notes](https://github.com/indutny/bn.js/releases)
- [Changelog](https://github.com/indutny/bn.js/blob/master/CHANGELOG.md)
- [Commits](https://github.com/indutny/bn.js/compare/v5.2.2...v5.2.3)

Updates `js-yaml` from 3.14.1 to 3.14.2
- [Changelog](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md)
- [Commits](https://github.com/nodeca/js-yaml/compare/3.14.1...3.14.2)

Updates `jws` from 3.2.2 to 3.2.3
- [Release notes](https://github.com/brianloveswords/node-jws/releases)
- [Changelog](https://github.com/auth0/node-jws/blob/master/CHANGELOG.md)
- [Commits](https://github.com/brianloveswords/node-jws/compare/v3.2.2...v3.2.3)

Updates `minimatch` from 3.1.2 to 3.1.5
- [Changelog](https://github.com/isaacs/minimatch/blob/main/changelog.md)
- [Commits](https://github.com/isaacs/minimatch/compare/v3.1.2...v3.1.5)

Updates `qs` from 6.13.0 to 6.14.2
- [Changelog](https://github.com/ljharb/qs/blob/main/CHANGELOG.md)
- [Commits](https://github.com/ljharb/qs/compare/v6.13.0...v6.14.2)

Updates `axios` from 1.12.2 to 1.13.6
- [Release notes](https://github.com/axios/axios/releases)
- [Changelog](https://github.com/axios/axios/blob/v1.x/CHANGELOG.md)
- [Commits](https://github.com/axios/axios/compare/v1.12.2...v1.13.6)

Updates `bn.js` from 5.2.2 to 5.2.3
- [Release notes](https://github.com/indutny/bn.js/releases)
- [Changelog](https://github.com/indutny/bn.js/blob/master/CHANGELOG.md)
- [Commits](https://github.com/indutny/bn.js/compare/v5.2.2...v5.2.3)

Updates `bn.js` from 4.12.2 to 4.12.3
- [Release notes](https://github.com/indutny/bn.js/releases)
- [Changelog](https://github.com/indutny/bn.js/blob/master/CHANGELOG.md)
- [Commits](https://github.com/indutny/bn.js/compare/v5.2.2...v5.2.3)

Removes `cookie`

Updates `form-data` from 2.3.3 to 4.0.5
- [Release notes](https://github.com/form-data/form-data/releases)
- [Changelog](https://github.com/form-data/form-data/blob/master/CHANGELOG.md)
- [Commits](https://github.com/form-data/form-data/commits/v4.0.5)

Updates `js-yaml` from 3.14.1 to 3.14.2
- [Changelog](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md)
- [Commits](https://github.com/nodeca/js-yaml/compare/3.14.1...3.14.2)

Updates `minimatch` from 3.1.2 to 3.1.5
- [Changelog](https://github.com/isaacs/minimatch/blob/main/changelog.md)
- [Commits](https://github.com/isaacs/minimatch/compare/v3.1.2...v3.1.5)

Updates `qs` from 6.10.4 to 6.14.2
- [Changelog](https://github.com/ljharb/qs/blob/main/CHANGELOG.md)
- [Commits](https://github.com/ljharb/qs/compare/v6.13.0...v6.14.2)

Updates `next` from 14.2.32 to 15.5.14
- [Release notes](https://github.com/vercel/next.js/releases)
- [Changelog](https://github.com/vercel/next.js/blob/canary/release.js)
- [Commits](https://github.com/vercel/next.js/compare/v14.2.32...v15.5.14)

Updates `@cypress/request` from 2.88.12 to 3.0.10
- [Release notes](https://github.com/cypress-io/request/releases)
- [Changelog](https://github.com/cypress-io/request/blob/master/CHANGELOG.md)
- [Commits](https://github.com/cypress-io/request/compare/v2.88.12...v3.0.10)

Removes `@tootallnate/once`

Updates `basic-ftp` from 5.0.5 to 5.2.0
- [Release notes](https://github.com/patrickjuchli/basic-ftp/releases)
- [Changelog](https://github.com/patrickjuchli/basic-ftp/blob/master/CHANGELOG.md)
- [Commits](https://github.com/patrickjuchli/basic-ftp/compare/v5.0.5...v5.2.0)

Updates `diff` from 5.2.0 to 5.2.2
- [Changelog](https://github.com/kpdecker/jsdiff/blob/master/release-notes.md)
- [Commits](https://github.com/kpdecker/jsdiff/compare/v5.2.0...v5.2.2)

Updates `flatted` from 3.3.3 to 3.4.2
- [Commits](https://github.com/WebReflection/flatted/compare/v3.3.3...v3.4.2)

Updates `lodash` from 4.17.21 to 4.17.23
- [Release notes](https://github.com/lodash/lodash/releases)
- [Commits](https://github.com/lodash/lodash/compare/4.17.21...4.17.23)

Updates `prismjs` from 1.27.0 to 1.30.0
- [Release notes](https://github.com/PrismJS/prism/releases)
- [Changelog](https://github.com/PrismJS/prism/blob/v2/CHANGELOG.md)
- [Commits](https://github.com/PrismJS/prism/compare/v1.27.0...v1.30.0)

Updates `tar-fs` from 3.0.4 to 3.1.2
- [Commits](https://github.com/mafintosh/tar-fs/compare/v3.0.4...v3.1.2)

---
updated-dependencies:
- dependency-name: axios
  dependency-version: 1.13.6
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: bn.js
  dependency-version: 5.2.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: bn.js
  dependency-version: 4.12.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: js-yaml
  dependency-version: 3.14.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: jws
  dependency-version: 3.2.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: minimatch
  dependency-version: 3.1.5
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: qs
  dependency-version: 6.14.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: axios
  dependency-version: 1.13.6
  dependency-type: direct:production
  dependency-group: npm_and_yarn
- dependency-name: bn.js
  dependency-version: 5.2.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: bn.js
  dependency-version: 4.12.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: cookie
  dependency-version: 
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: form-data
  dependency-version: 4.0.5
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: js-yaml
  dependency-version: 3.14.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: minimatch
  dependency-version: 3.1.5
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: qs
  dependency-version: 6.14.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: next
  dependency-version: 15.5.14
  dependency-type: direct:production
  dependency-group: npm_and_yarn
- dependency-name: "@cypress/request"
  dependency-version: 3.0.10
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: "@tootallnate/once"
  dependency-version: 
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: basic-ftp
  dependency-version: 5.2.0
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: diff
  dependency-version: 5.2.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: flatted
  dependency-version: 3.4.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: lodash
  dependency-version: 4.17.23
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: prismjs
  dependency-version: 1.30.0
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: tar-fs
  dependency-version: 3.1.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
...

Signed-off-by: dependabot[bot] <support@github.com>
Co-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com> (`a1a58fe`)
- Bump the npm_and_yarn group across 2 directories with 4 updates (#1)

Bumps the npm_and_yarn group with 3 updates in the /localbase-frontend directory: [axios](https://github.com/axios/axios), [next](https://github.com/vercel/next.js) and [brace-expansion](https://github.com/juliangruber/brace-expansion).
Bumps the npm_and_yarn group with 2 updates in the /localbase-api directory: [axios](https://github.com/axios/axios) and [brace-expansion](https://github.com/juliangruber/brace-expansion).


Updates `axios` from 1.9.0 to 1.12.2
- [Release notes](https://github.com/axios/axios/releases)
- [Changelog](https://github.com/axios/axios/blob/v1.x/CHANGELOG.md)
- [Commits](https://github.com/axios/axios/compare/v1.9.0...v1.12.2)

Updates `next` from 14.0.3 to 14.2.32
- [Release notes](https://github.com/vercel/next.js/releases)
- [Changelog](https://github.com/vercel/next.js/blob/canary/release.js)
- [Commits](https://github.com/vercel/next.js/compare/v14.0.3...v14.2.32)

Updates `brace-expansion` from 1.1.11 to 1.1.12
- [Release notes](https://github.com/juliangruber/brace-expansion/releases)
- [Commits](https://github.com/juliangruber/brace-expansion/compare/1.1.11...v1.1.12)

Updates `form-data` from 4.0.2 to 2.3.3
- [Release notes](https://github.com/form-data/form-data/releases)
- [Changelog](https://github.com/form-data/form-data/blob/master/CHANGELOG.md)
- [Commits](https://github.com/form-data/form-data/commits)

Updates `axios` from 1.9.0 to 1.12.2
- [Release notes](https://github.com/axios/axios/releases)
- [Changelog](https://github.com/axios/axios/blob/v1.x/CHANGELOG.md)
- [Commits](https://github.com/axios/axios/compare/v1.9.0...v1.12.2)

Updates `brace-expansion` from 1.1.11 to 1.1.12
- [Release notes](https://github.com/juliangruber/brace-expansion/releases)
- [Commits](https://github.com/juliangruber/brace-expansion/compare/1.1.11...v1.1.12)

Updates `form-data` from 4.0.2 to 4.0.4
- [Release notes](https://github.com/form-data/form-data/releases)
- [Changelog](https://github.com/form-data/form-data/blob/master/CHANGELOG.md)
- [Commits](https://github.com/form-data/form-data/commits)

---
updated-dependencies:
- dependency-name: axios
  dependency-version: 1.12.2
  dependency-type: direct:production
  dependency-group: npm_and_yarn
- dependency-name: next
  dependency-version: 14.2.32
  dependency-type: direct:production
  dependency-group: npm_and_yarn
- dependency-name: brace-expansion
  dependency-version: 1.1.12
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: form-data
  dependency-version: 2.3.3
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: axios
  dependency-version: 1.12.2
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: brace-expansion
  dependency-version: 1.1.12
  dependency-type: indirect
  dependency-group: npm_and_yarn
- dependency-name: form-data
  dependency-version: 4.0.4
  dependency-type: indirect
  dependency-group: npm_and_yarn
...

Signed-off-by: dependabot[bot] <support@github.com>
Co-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com> (`fa0b7e8`)
- Bump the go_modules group across 1 directory with 8 updates (#2)

Bumps the go_modules group with 3 updates in the /localbase-chain directory: [cosmossdk.io/math](https://github.com/cosmos/cosmos-sdk), [github.com/cometbft/cometbft](https://github.com/cometbft/cometbft) and [github.com/dvsekhvalnov/jose2go](https://github.com/dvsekhvalnov/jose2go).


Updates `cosmossdk.io/math` from 1.0.1 to 1.4.0
- [Release notes](https://github.com/cosmos/cosmos-sdk/releases)
- [Changelog](https://github.com/cosmos/cosmos-sdk/blob/main/CHANGELOG.md)
- [Commits](https://github.com/cosmos/cosmos-sdk/compare/math/v1.0.1...log/v1.4.0)

Updates `github.com/cometbft/cometbft` from 0.37.1 to 0.38.19
- [Release notes](https://github.com/cometbft/cometbft/releases)
- [Changelog](https://github.com/cometbft/cometbft/blob/v0.38.19/CHANGELOG.md)
- [Commits](https://github.com/cometbft/cometbft/compare/v0.37.1...v0.38.19)

Updates `github.com/dvsekhvalnov/jose2go` from 1.5.0 to 1.7.0
- [Commits](https://github.com/dvsekhvalnov/jose2go/compare/v1.5...v1.7.0)

Updates `github.com/golang/glog` from 1.1.0 to 1.2.3
- [Release notes](https://github.com/golang/glog/releases)
- [Commits](https://github.com/golang/glog/compare/v1.1.0...v1.2.3)

Updates `golang.org/x/crypto` from 0.8.0 to 0.33.0
- [Commits](https://github.com/golang/crypto/compare/v0.8.0...v0.33.0)

Updates `golang.org/x/net` from 0.9.0 to 0.35.0
- [Commits](https://github.com/golang/net/compare/v0.9.0...v0.35.0)

Updates `google.golang.org/grpc` from 1.55.0 to 1.70.0
- [Release notes](https://github.com/grpc/grpc-go/releases)
- [Commits](https://github.com/grpc/grpc-go/compare/v1.55.0...v1.70.0)

Updates `google.golang.org/protobuf` from 1.30.0 to 1.36.5

---
updated-dependencies:
- dependency-name: cosmossdk.io/math
  dependency-version: 1.4.0
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: github.com/cometbft/cometbft
  dependency-version: 0.38.19
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: github.com/dvsekhvalnov/jose2go
  dependency-version: 1.7.0
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: github.com/golang/glog
  dependency-version: 1.2.3
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: golang.org/x/crypto
  dependency-version: 0.33.0
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: golang.org/x/net
  dependency-version: 0.35.0
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: google.golang.org/grpc
  dependency-version: 1.70.0
  dependency-type: indirect
  dependency-group: go_modules
- dependency-name: google.golang.org/protobuf
  dependency-version: 1.36.5
  dependency-type: indirect
  dependency-group: go_modules
...

Signed-off-by: dependabot[bot] <support@github.com>
Co-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com> (`b32b5e3`)
- T (`62af90e`)