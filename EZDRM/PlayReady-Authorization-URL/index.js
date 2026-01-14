export default async function (context, req) {

  const token = req.query.token || "";
  const customData = req.query.CustomData || "";

  const response =
    "p1=5&p2=&p3=&p4=1&p5=0&p6=1&p7=0&p8=0" +
    "&token=" + token +
    "&CustomData=" + customData;

  context.res = {
    status: 200,
    headers: { "Content-Type": "text/plain" },
    body: response
  };
};