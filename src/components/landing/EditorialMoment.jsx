import Image from 'next/image';
import { Reveal } from '../shared/Reveal';

/**
 * A wide cinematic photographic intermission. Lives inside the bone
 * band between FeatureGrid and Stats, breaking the wall of text with
 * a single 21:9 frame that drifts on a slow ken-burns.
 *
 * No text overlay — the photo is the message. A small caption beneath
 * carries the credit so the moment stays editorial, not decorative.
 */
export function EditorialMoment() {
  return (
    <Reveal as="section" className="editorial-moment container">
      <div className="editorial-frame">
        <Image
          src="/properties/palm-springs/palm-springs-09.jpg"
          alt="The pool deck at Casa del Sol, Palm Springs"
          fill
          sizes="100vw"
          className="editorial-image"
        />
      </div>
      <div className="editorial-caption">
        <span className="caps">A glimpse inside</span>
        <span className="separator" aria-hidden>/</span>
        <span className="italic-quiet">
          Casa del Sol, Palm Springs &nbsp;&middot;&nbsp; The pool deck, golden hour
        </span>
      </div>
    </Reveal>
  );
}
