# 5.0.0

## Major updates

## Updates

## Bugs

- Fix issue with the Promise polyfill where a return value was expected from resolve() ([Deltakosh](https://github.com/deltakosh))

## Breaking changes

- Use both `mesh.visibility` and `material.alpha` values to compute the global alpha value used by the soft transparent shadow rendering code. Formerly was only using `mesh.visibility` ([Popov72](https://github.com/Popov72))
