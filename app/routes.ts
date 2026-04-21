import { type RouteConfig, layout, index, route } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/editor.tsx"),
    route("simulator", "routes/simulator.tsx"),
  ]),
] satisfies RouteConfig;
