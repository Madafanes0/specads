// Registro de plantillas. Cada brief se pasa como inputProps al renderizar.
import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import lumen from "../briefs/lumen.json";
import nordwear from "../briefs/nordwear.json";
import parcela from "../briefs/parcela.json";
import orbit from "../briefs/orbit.json";
import duolingo from "../briefs/duolingo.json";
import airbnb from "../briefs/airbnb.json";
import cazautoTunel from "../briefs/cazauto-tunel.json";
import { appFlowSchema, appShowcaseSchema, dataExplainerSchema, heroLogoSchema, mapPinSchema, tunnelSchema } from "./schemas";
import { Tunnel } from "./templates/Tunnel";
import { AppFlow } from "./templates/AppFlow";
import { AppShowcase } from "./templates/AppShowcase";
import { MapPin } from "./templates/MapPin";
import { DataExplainer } from "./templates/DataExplainer";
import { HeroLogo } from "./templates/HeroLogo";

const FPS = 60;

/** Duración del video a partir de durationSec del brief */
const metadata =
  <T extends { durationSec?: number }>(): CalculateMetadataFunction<T> =>
  ({ props }) => ({
    durationInFrames: Math.round((props.durationSec ?? 8) * FPS),
    fps: FPS,
  });

const common = { width: 1080, height: 1920, fps: FPS, durationInFrames: 8 * FPS } as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HeroLogo"
      component={HeroLogo}
      schema={heroLogoSchema}
      defaultProps={heroLogoSchema.parse(lumen)}
      calculateMetadata={metadata()}
      {...common}
    />
    <Composition
      id="DataExplainer"
      component={DataExplainer}
      schema={dataExplainerSchema}
      defaultProps={dataExplainerSchema.parse(nordwear)}
      calculateMetadata={metadata()}
      {...common}
    />
    <Composition
      id="MapPin"
      component={MapPin}
      schema={mapPinSchema}
      defaultProps={mapPinSchema.parse(parcela)}
      calculateMetadata={metadata()}
      {...common}
    />
    <Composition
      id="AppShowcase"
      component={AppShowcase}
      schema={appShowcaseSchema}
      defaultProps={appShowcaseSchema.parse(orbit)}
      calculateMetadata={metadata()}
      {...common}
    />
    {/* AppFlow: una composition por brief para comparar flujos en Studio */}
    {[duolingo, airbnb].map((brief) => (
      <Composition
        key={brief.brand}
        id={`AppFlow-${brief.brand}`}
        component={AppFlow}
        schema={appFlowSchema}
        defaultProps={appFlowSchema.parse(brief)}
        calculateMetadata={metadata()}
        {...common}
      />
    ))}
    <Composition
      id="AppFlow"
      component={AppFlow}
      schema={appFlowSchema}
      defaultProps={appFlowSchema.parse(duolingo)}
      calculateMetadata={metadata()}
      {...common}
    />
    <Composition
      id="Tunnel"
      component={Tunnel}
      schema={tunnelSchema}
      defaultProps={tunnelSchema.parse(cazautoTunel)}
      calculateMetadata={metadata()}
      {...common}
    />
  </>
);
