import faker from 'faker';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
import { Random } from 'meteor/random';
import { Factory } from 'meteor/dburles:factory';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';


// Brand collection
class BrandsCollection extends Mongo.Collection {
  insert(doc, callback) {
    const brand = _.clone(doc);

    // generate code automatically if there is no specified code
    if (!brand.code) {
      let code = Random.id().substr(0, 6);

      while (this.findOne({ code })) {
        code = Random.id().substr(0, 6);
      }

      brand.code = code;
    }

    if (this.findOne({ code: brand.code })) {
      throw new Meteor.Error('invalid-data', 'Duplicated code!');
    }

    brand.createdAt = new Date();
    brand.emailConfig = { type: 'simple' };

    return super.insert(brand, callback);
  }

  update(selector, modifier, options) {
    const set = modifier.$set || {};

    if (set.code) {
      throw new Meteor.Error('invalid-data', 'Can\'t change code field!');
    }

    return super.update(selector, modifier, options);
  }
}

export const Brands = new BrandsCollection('brands');

// Deny all client-side updates since we will be using methods to manage
// this collection
Brands.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

export const emailConfigSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['simple', 'custom'],
  },

  template: {
    type: String,
    optional: true,
  },
});

Brands.schema = new SimpleSchema({
  name: {
    type: String,
  },

  description: {
    type: String,
    optional: true,
  },
});

Brands.schemaExtra = new SimpleSchema({
  code: {
    type: String,
  },

  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },

  createdAt: {
    type: Date,
  },

  schema: {
    type: Object,
    blackbox: true,
    optional: true,
  },

  emailConfig: {
    type: emailConfigSchema,
    optional: true,
  },
});

Brands.attachSchema(Brands.schema);
Brands.attachSchema(Brands.schemaExtra);

Brands.publicFields = {
  name: 1,
  code: 1,
  description: 1,
  userId: 1,
  createdAt: 1,
  schema: 1,
  emailConfig: 1,
};

Factory.define('brand', Brands, {
  name: () => faker.random.word(),
  userId: () => Random.id(),
});
