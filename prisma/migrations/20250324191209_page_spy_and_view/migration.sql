-- CreateTable
CREATE TABLE "PageSpy" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "textString" TEXT,
    "fileBase64" TEXT,

    CONSTRAINT "PageSpy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSpyView" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "location" TEXT,
    "photoBase64" TEXT,
    "pageSpyId" TEXT NOT NULL,

    CONSTRAINT "PageSpyView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageSpy_path_key" ON "PageSpy"("path");

-- AddForeignKey
ALTER TABLE "PageSpyView" ADD CONSTRAINT "PageSpyView_pageSpyId_fkey" FOREIGN KEY ("pageSpyId") REFERENCES "PageSpy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
