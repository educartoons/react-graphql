const { forwardTo } = require("prisma-binding");
const { hasPermission } = require("../utils/utils");

const Query = {
  // items: forwardTo('db'),
  // async items(parent, args, context, info){
  //   const items = await context.db.query.items();
  //   return items;
  // }
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  me(parent, args, context, info) {
    if (!context.request.userId) {
      return null;
    }
    return context.db.query.user(
      {
        where: { id: context.request.userId }
      },
      info
    );
  },
  async users(parent, args, context, info) {
    //1. Check of the user has the permissions to query all the users
    if (!context.request.userId) {
      throw new Error("You must be logged!");
    }
    hasPermission(context.request.user, ["ADMIN", "PERMISSIONUPDATE"]);
    //2 If they do, query all the users!
    return context.db.query.users({}, info);
  }
};

module.exports = Query;
