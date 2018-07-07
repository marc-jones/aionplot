This is a web app to facilitate interrogation of time series data collected
from *Brassica napus*. The data was collected from the cultivars **Tapidor** (a
semi-winter cultivar) and **Westar** (a spring cultivar) with the aim of being
able to decipher how the flowering time gene network is constructed, and how it
differs from the network elucidated in *Arabidopsis thaliana*.

### Growth Details

Plants were germinated and grown in a glasshouse for 2 weeks before being
transferred to a controlled environment room to undergo vernalization.
After 6 weeks of vernalization, plants were removed from the CER and grown
once more in a glasshouse until they began to flower.

### Sampling Details

At each time point, trays of plants were sampled and the tissue pooled. The
first true leaf and the apex of each plant was taken and frozen initially on
dry ice and then in liquid nitrogen. While on dry ice, apicies were dissected
using razor blades. The goal of the dissection was to remove as much leaf and
stem tissue as possible while leaving the apex intact.

### RNA Extraction Details

Tissue was ground and RNA extracted using the OMEGA bio-tek E.Z.N.A.® Plant RNA
Kit in accordance to the manufacturer instructions. An on-column DNase step
was also included, again, using a method provided by OMEGA bio-tek. RNA
quality assurance and sequencing was conducted by TGAC.

### Expression Quantification

The raw expression reads obtained from TGAC were analysed using the Tuxedo
Suite of tools. These consist of Bowtie, TopHat and Cufflinks. Bowtie is an
alignment algorithm which TopHat uses to align reads to a reference sequence.
TopHat is what is known as a splice-aware aligner, which means that
if a sequencing read spans a splice site TopHat will still be able to align
the read to genomic reference sequence. Finally, Cufflinks takes in the
positions of the aligned sequencing reads and performs quantification to give
an expression level for each identified transcript.

The data available in this web app was generated using the availble *Brassica
napus* genome sequence as a reference sequence. This sequence was generated
from sequencing the *Brassica napus* cultivar Darmor-*bzh* 
(<a href="http://www.sciencemag.org/content/345/6199/950.full", target="_blank">Chalhoub et al. 2014</a>).
Transcripts were determined directly from the sequencing data by Cufflinks.

Cufflinks uses a statistical model to estimate the uncertainty of each of the
expression measurements it calculates. This model takes into account biological
noise and technical noise, through the use of repeat experiments, as well as
read mapping uncertainty. Read mapping uncertainty is due to sequencing reads
having multiple potential positions within the reference genome from which they
could originate. As we used pooled samples, we have not got repeat data for any
of the time points. When this is the case, Cufflinks assumes that samples can
be considered repeats of each other and therefore considers all of our samples,
across time, accession and tissue, as repeat measurements in the calculation of
the uncertainty for each measurement. This causes inflation of the error bars
we see. Going forward we plan to resequence certain samples to allow Cufflinks
to calculate a more accurate error model.