export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      id: 1,
      username: "admin",
      role: "ADMIN",
      first_name: "Luca",
      last_name: "Franceschetti",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
