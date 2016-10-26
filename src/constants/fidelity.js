export const RENDER_SETTINGS = {
  LOW: {
    useSubsurface: false,
    useShadow: false,
    shadowMapSize: null
  },
  MED: {
    useSubsurface: false,
    useShadow: true,
    shadowMapSize: 512
  },
  HIGH: {
    useSubsurface: true,
    useShadow: true,
    shadowMapSize: 1024
  }
}
