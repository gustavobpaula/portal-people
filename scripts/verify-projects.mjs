const knownProjects = new Set(["neutral-remote", "beneficios", "ferias"]);

function valuesFor(name) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    const argument = process.argv[index];
    if (argument === `--${name}`) values.push(process.argv[index + 1]);
    if (argument.startsWith(`--${name}=`))
      values.push(argument.slice(name.length + 3));
  }
  return values
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Parses a squad-owned remote selection while keeping the shell dependencies mandatory. */
export function selectedProjects() {
  const projects = new Set([...valuesFor("project"), ...valuesFor("projects")]);
  for (const project of projects) {
    if (!knownProjects.has(project)) {
      throw new Error(
        `Projeto inválido: ${project}. Use ${[...knownProjects].join(", ")}.`,
      );
    }
  }
  return projects;
}

export function includesProject(selection, project) {
  return selection.size === 0 || selection.has(project);
}
