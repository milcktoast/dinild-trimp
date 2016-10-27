export const RENDER_SETTINGS = {
  LOW: {
    useSubsurface: false,
    useShadow: false,
    shadowMapSize: null,
    textureQuality: 'low'
  },
  MED: {
    useSubsurface: false,
    useShadow: true,
    shadowMapSize: 512,
    textureQuality: 'med'
  },
  HIGH: {
    useSubsurface: true,
    useShadow: true,
    shadowMapSize: 1024,
    textureQuality: 'high'
  }
}
