import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { DocumentData } from '../App';
import { DocumentBlock } from '../components/BlockEditor';

// Convert image URL to base64
const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// Convert base64 to buffer
const base64ToBuffer = (base64: string): Uint8Array => {
  const base64Data = base64.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const generateDOCX = async (documentData: DocumentData, blocks?: DocumentBlock[]) => {
  try {
    const children: any[] = [];

    // Add letterhead if exists
    if (documentData.letterhead) {
      if (documentData.letterhead.type === 'uploaded' && documentData.letterhead.imageUrl) {
        try {
          const base64Data = await imageUrlToBase64(documentData.letterhead.imageUrl);
          const imageBuffer = base64ToBuffer(base64Data);
          
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 600,
                    height: 150,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            })
          );
        } catch (error) {
          console.error('Error adding letterhead image:', error);
        }
      } else if (documentData.letterhead.type === 'manual') {
        // Add manual letterhead
        if (documentData.letterhead.logoBase64) {
          try {
            const imageBuffer = base64ToBuffer(documentData.letterhead.logoBase64);
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 80,
                      height: 80,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              })
            );
          } catch (error) {
            console.error('Error adding logo:', error);
          }
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: documentData.letterhead.companyName || '',
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );

        if (documentData.letterhead.address) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: documentData.letterhead.address,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 50 },
            })
          );
        }

        const contactInfo = [];
        if (documentData.letterhead.phone) contactInfo.push(`Tel: ${documentData.letterhead.phone}`);
        if (documentData.letterhead.email) contactInfo.push(`Email: ${documentData.letterhead.email}`);
        if (documentData.letterhead.website) contactInfo.push(`Web: ${documentData.letterhead.website}`);

        if (contactInfo.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: contactInfo.join(' | '),
                  size: 18,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            })
          );
        }

        // Add separator line
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '_______________________________________________________________________________',
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }
    }

    // Add date
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: new Date(documentData.date).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            size: 22,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
      })
    );

    // Add recipient info for letters
    if (documentData.template.type === 'letter' && documentData.recipient) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Kepada Yth.',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: documentData.recipient,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Di tempat',
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Add memo header
    if (documentData.template.type === 'memo' && documentData.recipient) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Kepada: ${documentData.recipient}`,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Dari: Manajemen',
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Tanggal: ${new Date(documentData.date).toLocaleDateString('id-ID')}`,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        })
      );

      if (documentData.subject) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Perihal: ${documentData.subject}`,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          })
        );
      }
    }

    // Add subject for letters
    if (documentData.template.type === 'letter' && documentData.subject) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Perihal: ${documentData.subject}`,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Add document title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: documentData.title,
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Add content - either from blocks or traditional content
    if (blocks && blocks.length > 0) {
      // Use block-based content
      blocks.forEach((block) => {
        switch (block.type) {
          case 'paragraph':
            if (block.content.trim()) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: block.content,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                })
              );
            }
            break;

          case 'heading':
            if (block.content.trim()) {
              const headingLevel = block.level === 1 ? HeadingLevel.HEADING_1 : 
                                 block.level === 2 ? HeadingLevel.HEADING_2 : 
                                 HeadingLevel.HEADING_3;
              const fontSize = block.level === 1 ? 28 : block.level === 2 ? 26 : 24;

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: block.content,
                      bold: true,
                      size: fontSize,
                    }),
                  ],
                  heading: headingLevel,
                  spacing: { before: 300, after: 200 },
                })
              );
            }
            break;

          case 'list':
            if (block.listItems && block.listItems.length > 0) {
              block.listItems.forEach((item, index) => {
                if (item.trim()) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${index + 1}. ${item}`,
                          size: 22,
                        }),
                      ],
                      spacing: { after: 100 },
                      indent: { left: 400 },
                    })
                  );
                }
              });
            }
            break;

          case 'quote':
            if (block.content.trim()) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `"${block.content}"`,
                      italics: true,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 200 },
                  indent: { left: 400, right: 400 },
                  alignment: AlignmentType.CENTER,
                })
              );
            }
            break;
        }
      });
    } else {
      // Use traditional content
      const contentParagraphs = documentData.content.split('\n\n');
      contentParagraphs.forEach((paragraph) => {
        if (paragraph.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph.trim(),
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED,
            })
          );
        }
      });
    }

    // Add signature section
    if (documentData.signature && (documentData.signature.name || documentData.signature.position)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Hormat kami,',
              size: 22,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 600, after: 200 },
        })
      );

      // Add signature image if available
      if (documentData.signature.signatureImage) {
        try {
          const base64Data = documentData.signature.signatureImage.startsWith('data:') 
            ? documentData.signature.signatureImage 
            : await imageUrlToBase64(documentData.signature.signatureImage);
          const imageBuffer = base64ToBuffer(base64Data);
          
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 120,
                    height: 60,
                  },
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 },
            })
          );
        } catch (error) {
          console.error('Error adding signature image:', error);
          // Add space for manual signature
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '\n\n',
                  size: 22,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 },
            })
          );
        }
      } else {
        // Add space for manual signature
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '\n\n',
                size: 22,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          })
        );
      }

      if (documentData.signature.name) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: documentData.signature.name,
                bold: true,
                size: 22,
                underline: {},
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 100 },
          })
        );
      }

      if (documentData.signature.position) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: documentData.signature.position,
                size: 22,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          })
        );
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children,
        },
      ],
    });

    // Generate and save
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    saveAs(blob, `${documentData.title || 'dokumen'}.docx`);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    alert('Terjadi kesalahan saat membuat file DOCX');
  }
};