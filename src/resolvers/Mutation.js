const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { hasPermission } = require("../utils/utils");

const Mutations = {
  async createItem(parent, args, context, info) {
    if (!context.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const item = await context.db.mutation.createItem(
      {
        data: {
          // This is how to create a relationship
          user: {
            connect: {
              id: context.request.userId
            }
          },
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
    const item = await context.db.query.item({ where }, `{id title user {id}}`);
    // Check if the user own the item, or have the permissions

    const ownsItem = item.user.id === context.request.userId;
    const hasPermissions = context.request.user.permissions.some(permission =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );

    if (!ownsItem && !hasPermissions) {
      throw new Error("You do not have permission to do that!");
    }
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
  },
  async signIn(parent, { email, password }, context, info) {
    //1. Check if there is an user with that email
    const user = await context.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    //2. Check if their password is correect
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password");
    }
    //3. Generate the JWFT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    //4. Set the cookie with the token
    context.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    return user;
  },
  signOut(parent, args, context, info) {
    context.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
  async updatePermissions(parent, args, context, info) {
    //1. Check if the user is logged in
    if (!context.request.userId) {
      throw new Error(`You must be logged in!`);
    }
    //2. Query the current user
    const currentUser = await context.db.query.user(
      {
        where: { id: context.request.userId }
      },
      info
    );
    //3. Check if the user has permissions to do this
    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);
    //4. Update the permissions
    return context.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: {
          id: args.userId
        }
      },
      info
    );
  }
};

module.exports = Mutations;
