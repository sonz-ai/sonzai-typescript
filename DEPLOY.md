# DEPLOY — sonzai-typescript

## The rule

**Never release manually. Always use `just patch`.**

```bash
just patch              # bump patch, test, build, commit, push, npm publish, tag, gh release
just deploy 1.4.3       # same, for an explicit version
```

That runs the complete pipeline in order:

1. Preflight (version format, clean tree, on `main`, tag free)
2. `bun run test`
3. Bump `package.json` version + `User-Agent` in `src/http.ts`
4. Clean + build
5. Commit `release: vX.Y.Z`
6. `git push origin main`
7. `npm publish --access public`
8. Annotated tag `vX.Y.Z` + push
9. `gh release create vX.Y.Z --generate-notes`

Skip any step and the release is incomplete.

## Don't

- Don't manually edit `package.json`'s `version` and commit. `_bump` has to
  update the `User-Agent` header in `src/http.ts` too.
- Don't `npm publish` without also tagging and running `gh release create`.
- Don't `git tag` manually — let `_tag` do it so the tag message matches.
- Don't bump minor/major without explicit user approval (patch is the
  default discipline on this tree).

## Recovering a half-manual release

If someone already bumped + committed + pushed + tagged but skipped npm /
gh release (this happened on v1.4.1 and v1.4.2), run the missing steps:

```bash
just _publish 1.4.2
just _release 1.4.2
```

Or — cleaner — skip ahead with `just patch` to `1.4.3` and let the full
pipeline run.

## See also

[`../DEPLOY.md`](../DEPLOY.md) — canonical guide covering all four repos
(sonzai-typescript, sonzai-python, sonzai-go, sonzai-openclaw).
