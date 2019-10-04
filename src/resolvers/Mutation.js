const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Mutations = {
  async createItem(parent, args, context, info) {
    const item = await context.db.mutation.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );
    return item;
  },

  updateItem(parent, args, context, info) {
    const updates = { ...args };
    delete updates.id;

    return context.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, context, info) {
    const where = { id: args.id };
    // Check if the item exists
    const item = await context.db.query.item({ where }, `{id title}`);
    // Check if
    return context.db.mutation.deleteItem({ where }, info);
  },
  async signUp(parent, args, context, info) {
    args.email = args.email.toLowerCase();
    // has their password
    const password = await bcrypt.hash(args.password, 10);
    // create user in the db
    const user = await context.db.mutation.createUser(
      { data: { ...args, password, permissions: { set: ["USER"] } } },
      info
    );
    // create the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // we set the jwt as a cokkie on the response
    context.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 Year cookie
    });
    // finally reeturn the user to the browser
    return user;
  }
};

module.exports = Mutations;
