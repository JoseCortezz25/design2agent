import { PLUGIN } from '@common/networkSides';
import { PLUGIN_CHANNEL } from '@plugin/plugin.network';
import { Networker } from 'monorepo-networker';

async function bootstrap() {
  Networker.initialize(PLUGIN, PLUGIN_CHANNEL);

  if (figma.editorType === 'figma') {
    figma.showUI(__html__, {
      width: 360,
      height: 620,
      title: 'Design MD'
    });
  } else if (figma.editorType === 'figjam') {
    figma.showUI(__html__, {
      width: 360,
      height: 620,
      title: 'Design MD'
    });
  }
}

bootstrap();
