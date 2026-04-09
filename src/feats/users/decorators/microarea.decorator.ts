import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MICROAREA_MATCH_KEY = 'microarea_entity';
export const RequireMicroareaMatch = (entityType: string) => SetMetadata(REQUIRE_MICROAREA_MATCH_KEY, entityType);
