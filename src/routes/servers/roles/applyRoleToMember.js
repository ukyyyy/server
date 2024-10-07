import { ServerRoles } from '../../../models/ServerRoles';
import { ServerMembers } from '../../../models/ServerMembers';
import { Users } from "../../../models/Users";
import { SERVER_ROLE_ADDED_TO_MEMBER } from '../../../ServerEventNames';
const redis = require("../../../redis");

// /:server_id/members/:member_id/roles/:role_id
module.exports = async (req, res, next) => {
  try {
    const { server_id, member_id, role_id } = req.params;

    const user = await Users.findOne({ id: member_id });
    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }

    const role = await ServerRoles.findOne({ id: role_id, server_id: server_id }).select("bot order default");
    if (!role || role.default === true) {
      return res.status(404).json({ message: "Role does not exist." });
    }

    if (role.bot) {
      return res.status(403).json({ message: "This is a bot role." });
    }

    const serverMember = await ServerMembers.findOne({ server_id: server_id, member: user._id });
    if (!serverMember) {
      return res.status(404).json({ message: "Member does not exist." });
    }

    const isCreator = req.server.creator === req.user._id;
    if (!isCreator && req.highestRolePosition >= role.order) {
      return res.status(403).json({ message: "Your role priority is too low to perform this action." });
    }

    const updateResult = await ServerMembers.updateOne(
      { _id: serverMember._id },
      { $addToSet: { roles: role_id } }
    );

    if (updateResult.nModified === 0) {
      return res.status(200).json({ message: "Role already assigned to the member." });
    }

    redis.remServerMember(member_id, server_id);

    const io = req.io;
    io.in("server:" + server_id).emit(SERVER_ROLE_ADDED_TO_MEMBER, {
      role_id: role_id,
      id: member_id,
      server_id: server_id,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error assigning role to member:", error);
    next(error);
  }
};
