<center><h2>How To Use</h2></center>

In order to search the database, please use the Search, BLAST Search and Table tabs.
How they are used is explained as follows.

### Search

<div class="[ form-group ]" style="margin: 0; padding: 0;">
The Search tab allows users to plot the expression of <em>Brassica napus</em> genes across developmental time.
To search for <em>Brassica napus</em> genes, type the gene abbreviation (e.g. FLC) or the AGI code (e.g. AT5G10140) of an <em>Arabidopsis thaliana</em> gene and select the gene from the dropdown list.
You may enter multiple <em>Arabidopsis thaliana</em> genes at once.
<em>Brassica napus</em> genes which show homology to your genes of interest will be diplayed below the search box.
To plot the expression of a <em>Brassica napus</em> gene, click on its name.
Hovering over the button or the name of the gene in the plot legend will reveal the <em>Brassica napus</em> chromosome where that gene is located.
The colour of the button indicates the homology status of the <em>Brassica napus</em> gene.
If the button is green
<input type="checkbox" disabled="disabled" checked="checked" name="success_example" id="success_example" autocomplete="off">
<div class="[ btn-group ]" data-toggle="tooltip" title="" data-original-title="Chromosome">
    <label for="success_example" class="[ btn btn-success ]">
        <span class="[ glyphicon glyphicon-ok ]"></span>
        <span></span>
    </label>
    <label for="success_example" class="[ btn btn-success active ]">
        XLOC_045627
    </label>
</div>
 that indicates that that <em>Brassica napus</em> gene has greatest homology to the selected <em>Arabidopsis thaliana</em> transcript.
If the button is yellow
<input type="checkbox" disabled="disabled" checked="checked" name="warning_example" id="warning_example" autocomplete="off">
<div class="[ btn-group ]" data-toggle="tooltip" title="" data-original-title="Chromosome">
    <label for="warning_example" class="[ btn btn-warning ]">
        <span class="[ glyphicon glyphicon-ok ]"></span>
        <span></span>
    </label>
    <label for="warning_example" class="[ btn btn-warning active ]">
        XLOC_043931
    </label>
</div>
 that indicates that that <em>Brassica napus</em> gene has greatest homology to a splice variant of the selected <em>Arabidopsis thaliana</em> transcript.
If the button is white
<input type="checkbox" disabled="disabled" checked="checked" name="default_example" id="default_example" autocomplete="off">
<div class="[ btn-group ]" data-toggle="tooltip" title="" data-original-title="Chromosome">
    <label for="default_example" class="[ btn btn-default ]">
        <span class="[ glyphicon glyphicon-ok ]"></span>
        <span></span>
    </label>
    <label for="default_example" class="[ btn btn-default active ]">
        XLOC_017190
    </label>
</div>
 that indicates that that <em>Brassica napus</em> gene has greatest homology to another <em>Arabidopsis thaliana</em> transcript.
</div>

### BLAST Search

Not all <em>Brassica napus</em> genes in the dataset show homology to a gene from <em>Arabidopsis thaliana</em>.
In order to allow the expression of these genes to be plotted, the database can be searched using a DNA sequence.
To do this, copy and paste your sequence of interest into the text box on the BLAST Search tab.
The information box on that page will indicate the number of <em>Brassica napus</em> genes which show homology to your sequence.
To plot the expression of these genes, navigate back to the Search tab.
The genes which show homology to the sequence you entered in the BLAST Search tab will be displayed as 'BLAST Hits'.

### Table

Displays a table of details about the <em>Brassica napus</em> genes currently selected in the Search tab.
Clicking the <span class="glyphicon glyphicon-plus"></span> symbol will expand the row to reveal further homology information about that gene.
The homology information is a table of all <em>Arabidopsis thaliana</em> transcripts which the relevant <em>Brassica napus</em> gene shows homology to, ranked by the BLAST HSP bit score.
The row colouring matches the button colouring detailed above in the section explaining the Search tab.
