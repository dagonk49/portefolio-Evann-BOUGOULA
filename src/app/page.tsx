import { ModeRoot } from "@/components/ModeRoot";
import { SoberPortfolio } from "@/components/sober/SoberPortfolio";

/**
 * Le mode sobre est rendu en HTML statique (lisible sans JavaScript ni WebGL).
 * `ModeRoot` ajoute la bascule de mode et charge le lab 3D uniquement à la demande.
 */
export default function Home() {
  return (
    <ModeRoot>
      <SoberPortfolio />
    </ModeRoot>
  );
}
