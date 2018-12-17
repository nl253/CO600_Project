const LOCALS = {
  'title': 'FreeLearn',
  'authors': [
    {
      'name': 'Norbert Logiewa',
      'email': 'nl253@kent.ac.uk',
    },
    {
      'name': 'Imaan Fakim',
      'email': 'if50@kent.ac.uk',
    },
    {
      'name': 'Nicolas Valderrabano',
      'email': 'nv55@kent.ac.uk',
    },
  ],
};


module.exports = (app, locals = LOCALS) => {
  for (const pair of Object.entries(locals)) {
    const [k, v] = pair;
    app.locals[k] = v;
  }
  console.info('');
  const heading = 'APP LOCALS';
  console.info(heading);
  console.info('-'.repeat(Math.min(80, heading.length)));
  console.info(app.locals);
  return LOCALS;
};
