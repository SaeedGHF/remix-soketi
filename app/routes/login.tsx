import { ActionFunction, ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import { addUserAction } from "~/services/user.server";

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const body = await request.formData();

  let username: string | undefined = body?.get("username")?.toString();
  if (!username) {
    throw new Error("Username is required");
  }

  const user = await prisma.users.upsert({
    where: {
      username: username,
    },
    update: {},
    create: {
      username: username,
      password: "test",
    },
  });

  let userId: number | undefined = user.id;
  if (!userId) {
    throw new Error("Failed to create user");
  }

  return redirect(`/conversations/${userId}`)
};
