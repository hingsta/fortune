var fortune = require('../lib/fortune');

module.exports = function(options, port) {
  var app = fortune(options);

  app.inflect.inflections.plural("MOT", "MOT");

  if (app.adapter.mongoose) {
    app.adapter.awaitConnection().then(function() {
      console.log('Dropping database');
      app.adapter.mongoose.connections[1].db.dropDatabase();
    }, function(err){ console.trace(err); });
  }

  app.router.post("/remove-pets-link/:personid", function(req, res) {
    var Person = app.adapter.model("person");
    Person.findOne({email: req.params.personid}, function(err,person) {
      if (err) {
        console.error(err);
        res.send(500,err);
        return;
      }
      person.pets = null;
      person.save(function() {
        res.send(200);
      });
    });

  });

  return app.resource('person', {
    name: String,
    appearances: Number,
    email: String,
    pets: ['pet'],
    soulmate: {ref: 'person', inverse: 'soulmate', pkType: String},
    lovers: [{ref: 'person', inverse: 'lovers', pkType: String}],
    externalResources: [{ ref: "externalResourceReference", pkType: String, external: true }],
    cars: [{ref:'car', pkType: String}],
    houses: [{ref: 'house', inverse: 'owners'}]
  }, {model: {pk:"email"}})

  .resource('house', {
    address: String,
    owners: [{ref: 'person', inverse: 'houses', pkType: String}]
  })
  .resource('pet', {
    name: String,
    appearances: Number,
    owner: {ref:'person', type: String}
  })

  .resource('car', {
    licenseNumber: String,
    model: String,
    owner: {ref:'person', type: String},
    MOT: {ref: 'service', external: true, type: String},
    additionalDetails: {
      seats: Number
    }
  },{ model: { pk: "licenseNumber" } })

  .after('person', function() {
    this.nickname = 'Super ' + this.name;
    return this;
  })

  .after('person', function() {
    this.nickname = this.nickname + '!';
    return this;
  })

  .listen(port);

};

