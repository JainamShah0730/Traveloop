const p = require('./src/db');
p.travelPackage.count().then(c => console.log('Packages:', c)).finally(() => p.$disconnect());
