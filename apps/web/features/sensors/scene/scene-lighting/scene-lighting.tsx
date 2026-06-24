// Ambient fill + a single directional key light — matches the BMS concept's
// flat, even lighting so the emissive sensor cores read clearly.
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.6} />
    </>
  );
}
