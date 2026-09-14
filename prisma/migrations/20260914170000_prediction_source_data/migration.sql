-- Market parameters belong to each pick, not its shared match fixture.
ALTER TABLE "predictions" ADD COLUMN "sourceData" JSONB;
