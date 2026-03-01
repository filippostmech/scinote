import { db } from "./db";
import { documents } from "@shared/schema";

const sampleDocuments = [
  {
    title: "CRISPR-Cas9 Protocol Notes",
    icon: "🧬",
    blocks: [
      { id: "s1a", type: "heading1", content: "CRISPR-Cas9 Gene Editing Protocol" },
      { id: "s1b", type: "text", content: "This document outlines our standardized protocol for CRISPR-Cas9 mediated gene editing in mammalian cell lines." },
      { id: "s1c", type: "heading2", content: "Materials Required" },
      { id: "s1d", type: "bulleted-list", content: "Cas9 nuclease protein (NEB, Cat# M0386)" },
      { id: "s1e", type: "bulleted-list", content: "sgRNA targeting sequence (custom synthesized)" },
      { id: "s1f", type: "bulleted-list", content: "Lipofectamine 3000 transfection reagent" },
      { id: "s1g", type: "bulleted-list", content: "Opti-MEM reduced serum medium" },
      { id: "s1h", type: "heading2", content: "Procedure" },
      { id: "s1i", type: "numbered-list", content: "Seed HEK293T cells at 70% confluency in 24-well plates" },
      { id: "s1j", type: "numbered-list", content: "Prepare RNP complex: mix 1 μg Cas9 with 300 ng sgRNA" },
      { id: "s1k", type: "numbered-list", content: "Incubate RNP at room temperature for 10 minutes" },
      { id: "s1l", type: "numbered-list", content: "Transfect cells using Lipofectamine 3000 per manufacturer protocol" },
      { id: "s1m", type: "callout", content: "Critical: Always include a non-targeting control sgRNA in parallel experiments to account for off-target effects." },
      { id: "s1n", type: "heading2", content: "Analysis" },
      { id: "s1o", type: "code", content: "# T7 Endonuclease Assay Analysis\nimport numpy as np\n\ndef calc_indel_freq(cut_band, uncut_band):\n    frac_cut = cut_band / (cut_band + uncut_band)\n    return 1 - np.sqrt(1 - frac_cut)" },
      { id: "s1p", type: "text", content: "Expected editing efficiency: 40-80% depending on the target locus and sgRNA design score." },
    ],
  },
  {
    title: "Nanoparticle Synthesis — Batch 47",
    icon: "⚗️",
    blocks: [
      { id: "s2a", type: "heading1", content: "Gold Nanoparticle Synthesis Log" },
      { id: "s2b", type: "quote", content: "\"The key to reproducible nanoparticle synthesis lies in meticulous control of nucleation kinetics.\" — Turkevich, 1951" },
      { id: "s2c", type: "heading2", content: "Batch Parameters" },
      { id: "s2d", type: "bulleted-list", content: "HAuCl₄ concentration: 0.25 mM" },
      { id: "s2e", type: "bulleted-list", content: "Na₃Ct concentration: 1.5 mM" },
      { id: "s2f", type: "bulleted-list", content: "Temperature: 100°C (reflux)" },
      { id: "s2g", type: "bulleted-list", content: "Reaction time: 20 minutes" },
      { id: "s2h", type: "divider", content: "" },
      { id: "s2i", type: "heading2", content: "Results" },
      { id: "s2j", type: "text", content: "DLS measurements show an average hydrodynamic diameter of 18.3 ± 2.1 nm with a PDI of 0.08, indicating excellent monodispersity." },
      { id: "s2k", type: "heading3", content: "UV-Vis Characterization" },
      { id: "s2l", type: "text", content: "LSPR peak observed at λ = 520 nm, consistent with spherical AuNPs in the 15-20 nm range. No secondary peak at ~650 nm rules out significant aggregation." },
      { id: "s2m", type: "callout", content: "Note: Batch 47 showed improved size distribution compared to Batch 46 (PDI 0.15). The key change was reducing the citrate addition rate from bolus to dropwise over 30 seconds." },
    ],
  },
  {
    title: "ML Model Training — Protein Folding",
    icon: "🤖",
    blocks: [
      { id: "s3a", type: "heading1", content: "Protein Structure Prediction Model" },
      { id: "s3b", type: "text", content: "Training log and hyperparameter tracking for our transformer-based protein folding prediction model." },
      { id: "s3c", type: "heading2", content: "Architecture" },
      { id: "s3d", type: "text", content: "Modified ESMFold architecture with attention-based pairwise distance prediction. Input: amino acid sequence, Output: predicted 3D coordinates." },
      { id: "s3e", type: "code", content: "model_config = {\n    \"n_layers\": 48,\n    \"d_model\": 1024,\n    \"n_heads\": 16,\n    \"dropout\": 0.1,\n    \"max_seq_len\": 1024,\n    \"learning_rate\": 3e-4,\n    \"batch_size\": 32,\n    \"warmup_steps\": 4000\n}" },
      { id: "s3f", type: "heading2", content: "Training Progress" },
      { id: "s3g", type: "numbered-list", content: "Epoch 1-10: Loss stabilized from 4.2 to 1.8 (backbone FAPE)" },
      { id: "s3h", type: "numbered-list", content: "Epoch 11-25: Gradual improvement to 1.2, sidechain prediction improving" },
      { id: "s3i", type: "numbered-list", content: "Epoch 26-40: Loss plateau at 0.95, increased learning rate decay" },
      { id: "s3j", type: "heading3", content: "Validation Metrics" },
      { id: "s3k", type: "bulleted-list", content: "GDT-TS: 72.4% on CASP14 targets" },
      { id: "s3l", type: "bulleted-list", content: "TM-score: 0.81 average" },
      { id: "s3m", type: "bulleted-list", content: "RMSD: 2.3 Å for sequences < 300 residues" },
      { id: "s3n", type: "callout", content: "Next steps: Implement recycling mechanism (3 iterations) and MSA embedding module for improved accuracy on multi-domain proteins." },
    ],
  },
  {
    title: "Lab Meeting Agenda — March 2026",
    icon: "📋",
    blocks: [
      { id: "s4a", type: "heading1", content: "Lab Meeting — March 5, 2026" },
      { id: "s4b", type: "heading2", content: "Agenda" },
      { id: "s4c", type: "numbered-list", content: "Review of Q1 milestones and deliverables" },
      { id: "s4d", type: "numbered-list", content: "Presentation: New fluorescent probe characterization (Sarah)" },
      { id: "s4e", type: "numbered-list", content: "Discussion: Grant proposal for NIH R01 renewal" },
      { id: "s4f", type: "numbered-list", content: "Equipment updates — new mass spectrometer installation timeline" },
      { id: "s4g", type: "numbered-list", content: "Safety training reminder and lab notebook audit" },
      { id: "s4h", type: "divider", content: "" },
      { id: "s4i", type: "heading2", content: "Action Items from Last Meeting" },
      { id: "s4j", type: "bulleted-list", content: "Complete Western blot quantification for manuscript Figure 3" },
      { id: "s4k", type: "bulleted-list", content: "Submit IRB amendment for clinical sample collection" },
      { id: "s4l", type: "bulleted-list", content: "Order replacement parts for HPLC column" },
      { id: "s4m", type: "text", content: "All team members should update their project timelines in the shared tracker before the meeting." },
    ],
  },
];

export async function seedDatabase() {
  const existing = await db.select().from(documents);
  if (existing.length > 0) return;

  for (const doc of sampleDocuments) {
    await db.insert(documents).values({
      title: doc.title,
      icon: doc.icon,
      blocks: doc.blocks,
    });
  }

  console.log("Seeded database with sample documents");
}
